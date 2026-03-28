import { Handler } from '@netlify/functions';
import { Pool } from 'pg';

export const handler: Handler = async (event, context) => {
    console.log('--- Orders API Started ---');
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        console.log('Fetching orders from Neon...');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        await pool.end();
        console.log(`Successfully fetched ${result.rows.length} orders`);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.rows),
        };
    } catch (error: any) {
        console.error('Orders API Error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to fetch orders: ${error.message}` }),
        };
    }
};
