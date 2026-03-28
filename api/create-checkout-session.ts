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
        const { size, colorName, colorId } = req.body;

        if (!size || !colorName) {
            return res.status(400).json({ error: 'Missing size or color' });
        }

        const origin = req.headers.origin || 'https://zurrue.ch';
        const priceId = process.env.STRIPE_PRICE_ID;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['CH', 'DE', 'AT', 'FR', 'IT', 'LI'],
            },
            line_items: [
                priceId ? {
                    price: priceId,
                    quantity: 1,
                } : {
                    price_data: {
                        currency: 'chf',
                        product_data: {
                            name: `zurrue Trainerhose`,
                            description: `Farbe: ${colorName}, Größe: ${size} (Inkl. Versand 7.50 CHF)`,
                        },
                        unit_amount: 5150, // 51.50 CHF inkl. Versand
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/success`,
            cancel_url: `${origin}/?canceled=true`,
            metadata: { size, color: colorName }
        });

        return res.status(200).json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
