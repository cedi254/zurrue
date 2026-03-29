import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-03-25.dahlia',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { cart } = req.body;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty or invalid' });
        }

        const origin = req.headers.origin || 'https://zurrue.ch';
        const priceId = process.env.STRIPE_PRICE_ID;

        // Line Items aus dem Warenkorb generieren
        const line_items = cart.map((item: any) => {
            return {
                price_data: {
                    currency: 'chf',
                    product_data: {
                        name: `zurrue Trainerhose`,
                        description: `Farbe: ${item.color}, Größe: ${item.size}`,
                    },
                    unit_amount: 4400, // 44.00 CHF Preis pro Hose
                },
                quantity: item.quantity || 1,
            };
        });

        // Einmalige Versandkosten hinzufügen (7.50 CHF)
        line_items.push({
            price_data: {
                currency: 'chf',
                product_data: {
                    name: 'Versandkosten',
                    description: 'Pauschale für gesicherte Lieferung',
                },
                unit_amount: 750, // 7.50 CHF
            },
            quantity: 1,
        });

        // Zusammenfassung für Metadaten (max 500 chars)
        const itemsSummary = cart.map((i: any) => `${i.color} (${i.size})`).join(', ');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['CH', 'DE', 'AT', 'FR', 'IT', 'LI'],
            },
            line_items,
            mode: 'payment',
            success_url: `${origin}/success`,
            cancel_url: `${origin}/?canceled=true`,
            metadata: {
                itemsCount: cart.length.toString(),
                itemsSummary: itemsSummary.substring(0, 500),
                cartJson: JSON.stringify(cart).substring(0, 500) // Fallback für Webhook
            }
        });

        return res.status(200).json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
