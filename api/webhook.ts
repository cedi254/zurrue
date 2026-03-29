import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Pool } from 'pg';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-03-25.dahlia',
});

// Helper-Funktion um den rohen Request-Body zu lesen (Wichtig für Stripe Signatur)
async function getRawBody(req: VercelRequest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        let chunks: any[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
        return res.status(400).send('Webhook Error: Missing signature or secret');
    }

    let event;

    try {
        const rawBody = await getRawBody(req);
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const customerName = session.customer_details?.name || 'Unbekannt';
        const customerEmail = session.customer_details?.email || 'Unbekannt';
        const addressDetails = session.customer_details?.address;

        // Einzelne Adressfelder extrahieren
        const street = addressDetails?.line1 || '';
        const houseNumber = addressDetails?.line2 || '';
        const zipCode = addressDetails?.postal_code || '';
        const city = addressDetails?.city || '';
        const country = addressDetails?.country || '';

        // Farbe und Größe aus Metadaten extrahieren
        const itemsCount = session.metadata?.itemsCount || '1';
        const itemsSummary = session.metadata?.itemsSummary || 'Unbekannt';

        // In den Spalten color/size speichern wir bei Warenkörben eine Zusammenfassung
        const color = itemsCount === '1' ? itemsSummary : 'Multi-Item';
        const size = itemsCount === '1' ? (session.metadata?.size || 'Standard') : `${itemsCount} Hosen`;

        const totalAmount = session.amount_total;
        const paymentStatus = session.payment_status;
        const items = session.metadata || {};

        try {
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });

            const query = `
        INSERT INTO orders (
          stripe_session_id, customer_name, customer_email, 
          street, house_number, zip_code, city, country, 
          color, size, items, total_amount, payment_status, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Offen')
        ON CONFLICT (stripe_session_id) DO NOTHING;
      `;

            await pool.query(query, [
                session.id,
                customerName,
                customerEmail,
                street,
                houseNumber,
                zipCode,
                city,
                country,
                color,
                size,
                JSON.stringify(items),
                totalAmount,
                paymentStatus
            ]);
            await pool.end();
            console.log(`✅ Bestellung ${session.id} erfolgreich mit Details gespeichert!`);
        } catch (dbErr: any) {
            console.error('Fehler beim Speichern in DB:', dbErr.message);
            return res.status(500).send('Database Error');
        }
    }

    return res.status(200).json({ received: true });
}
