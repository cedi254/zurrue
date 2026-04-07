import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { customerName, customerEmail, street, houseNumber, zipCode, city, country, size, color, totalAmount, paymentStatus } = req.body;

        if (!customerName || !size || !color || !totalAmount) {
            return res.status(400).json({ error: 'Missing required fields' });
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

        return res.status(200).json(result.rows[0]);
    } catch (error: any) {
        console.error('Order creation error:', error.message);
        return res.status(500).json({ error: 'Failed to create order' });
    }
}
