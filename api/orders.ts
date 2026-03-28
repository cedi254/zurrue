import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        await pool.end();

        return res.status(200).json(result.rows);
    } catch (error: any) {
        console.error('DB fetch error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch orders' });
    }
}
