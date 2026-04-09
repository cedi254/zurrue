import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { customerName, customerEmail, street, houseNumber, zipCode, city, country, size, color, items, totalAmount, paymentStatus } = req.body;

        if (!customerName || !totalAmount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let finalSize = size || 'M';
        let finalColor = color || 'Navy-Weiß';
        let finalItemsJson = JSON.stringify({ size: finalSize, color: finalColor });

        if (items && Array.isArray(items) && items.length > 0) {
            const totalQuantity = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
            const itemsSummary = items.map((i: any) => {
                let c = i.color;
                if (c === 'Navy-Weiss') c = 'Navy-Weiß';
                return `${i.quantity || 1}x ${c} (${i.size})`;
            }).join(', ');

            if (items.length === 1 && totalQuantity === 1) {
                finalColor = items[0].color;
                if (finalColor === 'Navy-Weiss') finalColor = 'Navy-Weiß';
                finalSize = items[0].size;
            } else {
                finalColor = 'Multi-Item';
                finalSize = `${totalQuantity} Hosen`;
            }

            finalItemsJson = JSON.stringify({
                itemsCount: totalQuantity.toString(),
                itemsSummary: itemsSummary.substring(0, 500),
                color: finalColor,
                size: finalSize
            });
        } else {
            // Normalize single item color if provided
            if (finalColor === 'Navy-Weiss') finalColor = 'Navy-Weiß';
            finalItemsJson = JSON.stringify({ size: finalSize, color: finalColor });
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
            finalColor,
            finalSize,
            finalItemsJson,
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
