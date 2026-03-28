import { Handler } from '@netlify/functions';
import { Pool } from 'pg';

export const handler: Handler = async (event, context) => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Erforderlich für Neon
    });

    try {
        const res = await pool.query('SELECT NOW()');
        await pool.end();
        return {
            statusCode: 200,
            body: JSON.stringify({ status: 'Connected', time: res.rows[0].now }),
        };
    } catch (err: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({ status: 'Error', message: err.message }),
        };
    }
};
