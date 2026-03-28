var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_stripe = __toESM(require("stripe"), 1);
var import_pg = require("pg");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var port = process.env.PORT || 3001;
var stripe = new import_stripe.default(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-03-25.dahlia"
});
var pool = new import_pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
  // Wichtig für Neon!
});
app.use(import_express.default.static(import_path.default.join(__dirname, "dist")));
app.post("/api/webhook", import_express.default.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !endpointSecret) {
    return res.status(400).send("Webhook Error: Missing signature or secret");
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const size = session.metadata?.size || "Unbekannt";
    const color = session.metadata?.color || "Unbekannt";
    const customerName = session.customer_details?.name || "Unbekannt";
    const customerEmail = session.customer_details?.email || "Unbekannt";
    const addressDetails = session.customer_details?.address;
    const shippingAddress = {
      line1: addressDetails?.line1,
      line2: addressDetails?.line2,
      city: addressDetails?.city,
      postal_code: addressDetails?.postal_code,
      country: addressDetails?.country
    };
    const totalAmount = session.amount_total;
    const paymentStatus = session.payment_status;
    const items = { size, color };
    try {
      const query = `
        INSERT INTO orders (stripe_session_id, customer_name, customer_email, shipping_address, items, total_amount, payment_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (stripe_session_id) DO NOTHING;
      `;
      await pool.query(query, [
        session.id,
        customerName,
        customerEmail,
        JSON.stringify(shippingAddress),
        JSON.stringify(items),
        totalAmount,
        paymentStatus
      ]);
      console.log(`\u2705 Bestellung ${session.id} erfolgreich in Neon-Datenbank gespeichert!`);
    } catch (dbErr) {
      console.error("Fehler beim Speichern in DB:", dbErr);
      return res.status(500).send("Database Error");
    }
  }
  res.json({ received: true });
});
app.use((0, import_cors.default)());
app.use(import_express.default.json());
app.post("/api/create-checkout-session", async (req, res) => {
  const { size, colorName } = req.body;
  if (!size || !colorName) {
    return res.status(400).json({ error: "Gr\xF6\xDFe oder Farbe fehlt" });
  }
  try {
    const origin = req.headers.origin || "https://zurrue.ch";
    const priceId = process.env.STRIPE_PRICE_ID;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "twint"],
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["CH", "DE", "AT", "FR", "IT", "LI"]
      },
      line_items: [
        priceId ? {
          price: priceId,
          quantity: 1
        } : {
          price_data: {
            currency: "chf",
            product_data: {
              name: `zurrue Trainerhose`,
              description: `Farbe: ${colorName}, Gr\xF6\xDFe: ${size} (Inkl. Versand 7.50 CHF)`
            },
            unit_amount: 5150
            // 51.50 CHF
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
      metadata: {
        size,
        color: colorName
      }
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("DB fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("*", (req, res) => {
  res.sendFile(import_path.default.join(__dirname, "dist", "index.html"));
});
app.listen(port, () => {
  console.log(`\u{1F680} API Server l\xE4uft auf Port ${port}`);
});
