import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-03-25.dahlia',
});

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { size, colorName, colorId } = JSON.parse(event.body || '{}');

        if (!size || !colorName) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing size or color' }) };
        }

        const origin = event.headers.origin || 'https://zurrue.ch';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'twint'],
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

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url }),
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
