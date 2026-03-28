import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { sessionId, status } = req.body;

    if (!sessionId || !status) {
        return res.status(400).json({ error: 'Missing sessionId or status' });
    }

    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const query = 'UPDATE orders SET status = $1 WHERE stripe_session_id = $2';
        await pool.query(query, [status, sessionId]);
        await pool.end();

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Update status error:', error.message);
        return res.status(500).json({ error: 'Failed to update status' });
    }
}
