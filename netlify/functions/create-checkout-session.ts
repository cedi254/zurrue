import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

export const handler: Handler = async (event, context) => {
    console.log('--- Checkout Function Started ---');

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        console.error('STRIPE_SECRET_KEY is missing in environment variables');
        return { statusCode: 500, body: JSON.stringify({ error: 'Server Config Error: Stripe key missing' }) };
    }

    const stripe = new Stripe(stripeKey, {
        apiVersion: '2026-03-25.dahlia',
    });

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        console.log('Decoding body...');
        const { size, colorName, colorId } = JSON.parse(event.body || '{}');

        if (!size || !colorName) {
            console.error('Missing size or color in request');
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing size or color' }) };
        }

        console.log(`Creating session for: ${size} - ${colorName}`);
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
            console.error('STRIPE_SECRET_KEY is missing in environment variables');
            return { statusCode: 500, body: JSON.stringify({ error: 'Server Config Error: Stripe key missing' }) };
        }

        const origin = event.headers.origin || 'https://zurrue.ch';
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
                        unit_amount: 5150, // 44.00 + 7.50 = 51.50 CHF
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/?success=true`,
            cancel_url: `${origin}/?canceled=true`,
            metadata: { size, color: colorName }
        });

        console.log('Session created successfully:', session.id);
        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url }),
        };
    } catch (error: any) {
        console.error('Stripe Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Unknown server error' }),
        };
    }
};
