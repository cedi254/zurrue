import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { Pool } from 'pg';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-03-25.dahlia',
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const sig = event.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret || !event.body) {
        return { statusCode: 400, body: 'Webhook Error: Missing signature or secret' };
    }

    let stripeEvent;
    try {
        stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
    } catch (err: any) {
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;

        const size = session.metadata?.size || 'Unbekannt';
        const color = session.metadata?.color || 'Unbekannt';
        const customerName = session.customer_details?.name || 'Unbekannt';
        const customerEmail = session.customer_details?.email || 'Unbekannt';
        const addressDetails = session.customer_details?.address;

        const shippingAddress = {
            line1: addressDetails?.line1,
            line2: addressDetails?.line2,
            city: addressDetails?.city,
            postal_code: addressDetails?.postal_code,
            country: addressDetails?.country,
        };

        const totalAmount = session.amount_total;
        const paymentStatus = session.payment_status;
        const items = { size, color };

        try {
            const query = `
        INSERT INTO orders (stripe_session_id, customer_name, customer_email, shipping_address, items, total_amount, payment_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (stripe_session_id) DO NOTHING;
      `;
            await pool.query(query, [
                session.id,
                customerName,
                customerEmail,
                JSON.stringify(shippingAddress),
                JSON.stringify(items),
                totalAmount,
                paymentStatus
            ]);
        } catch (dbErr) {
            console.error('Error saving to DB', dbErr);
            return { statusCode: 500, body: 'Database Error' };
        }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
