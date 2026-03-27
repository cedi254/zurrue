import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-03-25.dahlia',
});

export const handler: Handler = async (event, context) => {
    console.log('--- Checkout Function Started ---');

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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Twint temporär entfernt zum Testen
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['CH', 'DE', 'AT', 'FR', 'IT', 'LI'],
            },
            line_items: [
                {
                    price_data: {
                        currency: 'chf',
                        product_data: {
                            name: `zurrue Trainerhose`,
                            description: `Farbe: ${colorName}, Größe: ${size}`,
                        },
                        unit_amount: 4400,
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
