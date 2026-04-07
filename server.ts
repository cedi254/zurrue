import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Stripe (wir brauchen den secret key aus der .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-03-25.dahlia',
});

// Initialize Neon Postgres
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Wichtig für Neon!
});

// Statische Dateien aus dem "dist" Ordner servieren (nach dem Build)
app.use(express.static(path.join(__dirname, 'dist')));

// ==========================================
// 1. Stripe Webhook (braucht req.body als raw buffer)
// ==========================================
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
        return res.status(400).send('Webhook Error: Missing signature or secret');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Erfolgreiche Zahlung
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Die Optionen (Grösse, Farbe) haben wir bei der Session-Erstellung mitgeschickt
        const size = session.metadata?.size || 'Unbekannt';
        const color = session.metadata?.color || 'Unbekannt';

        // Kundendaten von Stripe
        const customerName = session.customer_details?.name || 'Unbekannt';
        const customerEmail = session.customer_details?.email || 'Unbekannt';
        const addressDetails = session.customer_details?.address;

        // Adresse schön verpacken
        const shippingAddress = {
            line1: addressDetails?.line1,
            line2: addressDetails?.line2,
            city: addressDetails?.city,
            postal_code: addressDetails?.postal_code,
            country: addressDetails?.country,
        };

        const totalAmount = session.amount_total; // in Rappen / Cents
        const paymentStatus = session.payment_status; // z.B. 'paid'
        const items = { size, color };

        // In die Neon Datenbank speichern!
        try {
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
                addressDetails?.line1 || '',
                addressDetails?.line2 || '',
                addressDetails?.postal_code || '',
                addressDetails?.city || '',
                addressDetails?.country || '',
                color,
                size,
                JSON.stringify(items),
                totalAmount,
                paymentStatus
            ]);
            console.log(`✅ Bestellung ${session.id} erfolgreich in Neon-Datenbank gespeichert!`);
        } catch (dbErr) {
            console.error('Fehler beim Speichern in DB:', dbErr);
            return res.status(500).send('Database Error');
        }
    }

    res.json({ received: true });
});

// Middleware für alle anderen Endpunkte, die normalen JSON-Body brauchen
app.use(cors());
app.use(express.json());

// ==========================================
// 2. Checkout Session dynamisch generieren
// ==========================================
app.post('/api/create-checkout-session', async (req, res) => {
    const { size, colorName } = req.body;

    if (!size || !colorName) {
        return res.status(400).json({ error: 'Größe oder Farbe fehlt' });
    }

    try {
        const origin = req.headers.origin || 'https://zurrue.ch';
        const priceId = process.env.STRIPE_PRICE_ID;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'twint'],
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['CH', 'DE', 'AT', 'FR', 'IT', 'LI'],
            },
            line_items: [
                priceId ? {
                    price: priceId,
                    quantity: 1,
                } : {
                    price_data: {
                        currency: 'chf',
                        product_data: {
                            name: `zurrue Trainerhose`,
                            description: `Farbe: ${colorName}, Größe: ${size} (Inkl. Versand 7.50 CHF)`,
                        },
                        unit_amount: 5150, // 51.50 CHF
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/?success=true`,
            cancel_url: `${origin}/?canceled=true`,
            metadata: {
                size,
                color: colorName
            }
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 3. Admin: Alle Bestellungen abrufen
// ==========================================
app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error: any) {
        console.error('DB fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.post('/api/create-order', async (req, res) => {
    try {
        const { customerName, customerEmail, street, houseNumber, zipCode, city, country, size, color, totalAmount, paymentStatus } = req.body;

        if (!customerName || !size || !color || !totalAmount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

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

        res.status(200).json(result.rows[0]);
    } catch (error: any) {
        console.error('Manual order create error:', error.message);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Healthcheck
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Fallback: Alle anderen Anfragen an die index.html schicken (für SPA Routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 API Server läuft auf Port ${port}`);
});
