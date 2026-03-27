import { Handler } from '@netlify/functions';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }

    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.rows),
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch orders' }),
        };
    }
};
