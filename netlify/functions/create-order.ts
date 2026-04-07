import { Handler } from '@netlify/functions';
import { Pool } from 'pg';

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { customerName, customerEmail, street, houseNumber, zipCode, city, country, size, color, totalAmount, paymentStatus } = body;

        if (!customerName || !size || !color || !totalAmount) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const stripeSessionId = `manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const query = `
            INSERT INTO orders (
                stripe_session_id, customer_name, customer_email, 
                street, house_number, zip_code, city, country, 
                color, size, items, total_amount, payment_status, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Offen')
            RETURNING *;
        `;

        const result = await pool.query(query, [
            stripeSessionId,
            customerName,
            customerEmail || '',
            street || '',
            houseNumber || '',
            zipCode || '',
            city || '',
            country || 'CH',
            color,
            size,
            JSON.stringify({ size, color }),
            totalAmount,
            paymentStatus || 'paid'
        ]);

        await pool.end();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.rows[0]),
        };
    } catch (error: any) {
        console.error('Order creation error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to create order: ${error.message}` }),
        };
    }
};
