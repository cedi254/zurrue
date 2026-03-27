import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Check, Star, Shield, Truck, ArrowRight, Clock, X } from 'lucide-react';
// Import assets
import logo from './assets/zurrue-logo-transparent.svg';
import sizeTableImg from './assets/Grössentabelle_Trainerhosen_zurrue.png';
import hosenNavy from './assets/zurrue-hosen-navy-white.png';
import hosenGrayBlack from './assets/zurrue-hosen-gray-black.png';
import hosenBlackWhite from './assets/zurrue-hosen-black-white.png';

import { PasswordGate } from './components/PasswordGate';

const COLORS = [
  { id: 'navy', name: 'Navy-Weiß', image: hosenNavy, style: { background: 'radial-gradient(circle, #ffffff 25%, #1e293b 26%)' } },
  { id: 'grau-schwarz', name: 'Grau-Schwarz', image: hosenGrayBlack, style: { background: 'radial-gradient(circle, #000000 25%, #9ca3af 26%)' } },
  { id: 'grau-weiss', name: 'Grau-Weiß', image: hosenGrayBlack, style: { background: 'radial-gradient(circle, #ffffff 25%, #9ca3af 26%)' } },
  { id: 'schwarz-weiss', name: 'Schwarz-Weiß', image: hosenBlackWhite, style: { background: 'radial-gradient(circle, #ffffff 25%, #000000 26%)' } },
  { id: 'schwarz-schwarz', name: 'Schwarz-Schwarz', image: hosenBlackWhite, style: { background: '#000000' } },
];

const SIZES = ['S', 'M', 'L', 'XL'];

function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const API_URL = `/.netlify/functions/orders`;
        const res = await fetch(API_URL);
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard - Bestellungen</h1>
        {loading ? (
          <p className="text-neutral-500">Lade Bestellungen...</p>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200">
                  <th className="p-4 font-semibold text-sm">Datum</th>
                  <th className="p-4 font-semibold text-sm">Kunde</th>
                  <th className="p-4 font-semibold text-sm">Bestellung</th>
                  <th className="p-4 font-semibold text-sm">Adresse</th>
                  <th className="p-4 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={order.id || i} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="p-4 text-sm whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="font-medium text-neutral-900">{order.customer_name}</div>
                      <div className="text-neutral-500">{order.customer_email}</div>
                    </td>
                    <td className="p-4 text-sm">
                      <span className="bg-neutral-100 px-2 py-1 rounded text-xs font-medium border border-neutral-200">
                        {order.items?.size} - {order.items?.color}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-neutral-600">
                      {order.shipping_address?.line1}<br />
                      {order.shipping_address?.postal_code} {order.shipping_address?.city}
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-500">
                      Keine Bestellungen gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;
  if (path === '/admin') {
    return (
      <PasswordGate>
        <AdminDashboard />
      </PasswordGate>
    );
  }

  return (
    <PasswordGate>
      <MainApp />
    </PasswordGate>
  );
}

function MainApp() {
  const [selectedColor, setSelectedColor] = useState(COLORS[4]);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isOrdering, setIsOrdering] = useState(false);
  const [showSizeTable, setShowSizeTable] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2 * 3600 + 45 * 60 + 30); // 2h 45m 30s

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePreOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOrdering(true);

    try {
      const API_URL = `/.netlify/functions/create-checkout-session`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          size: selectedSize,
          colorName: selectedColor.name,
          colorId: selectedColor.id
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Server Fehler: ${response.status}`);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout Error:', error);
      alert(`Verbindungsfehler: ${error.message}\n\nHinweis: \n1) Läuft die Netlify-Seite / hast du hochgeladen?\n2) Hast du "netlify dev" lokal benutzt anstatt "npm run dev"?\n3) Hat dein Stripe Account "Twint" aktiviert?`);
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Banner */}
      <div className="bg-red-600 text-white text-center py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2">
        <Clock className="w-4 h-4" />
        <span>Preorder noch offen bis:</span>
        <span className="font-mono font-bold text-base tracking-wider">{formatTime(timeLeft)}</span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={logo} alt="zurrue logo" className="h-10 w-auto object-contain" />
        </div>
        <div className="text-sm font-medium text-neutral-500">Restock 2026</div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">

          {/* Left Column: Image Gallery */}
          <div className="relative group">
            <motion.div
              key={selectedColor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="aspect-[4/5] bg-neutral-200 rounded-2xl overflow-hidden relative shadow-2xl"
            >
              <img
                src={selectedColor.image}
                alt={`Premium Trainerhose - ${selectedColor.name}`}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                Pre-Order
              </div>
            </motion.div>


          </div>

          {/* Right Column: Product Details & Form */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-3">
                zurrue Trainerhosen
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mb-6">
                <div className="flex text-yellow-400">
                  <Star className="w-4 h-4" fill="currentColor" />
                  <Star className="w-4 h-4" fill="currentColor" />
                  <Star className="w-4 h-4" fill="currentColor" />
                  <Star className="w-4 h-4" fill="currentColor" />
                  <div className="relative">
                    <Star className="w-4 h-4 text-neutral-300" fill="currentColor" />
                    <div className="absolute inset-0 overflow-hidden w-[80%] text-yellow-400">
                      <Star className="w-4 h-4" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <span className="text-sm text-neutral-600 font-medium ml-1">4.8/5 Sterne von 200+ Kunden</span>
              </div>

              {/* Price & Discount */}
              <div className="flex items-center flex-wrap gap-3 mb-10">
                <p className="text-3xl font-bold text-neutral-900">CHF 44.00</p>
                <p className="text-lg text-neutral-400 line-through">CHF 55.00</p>
                <div className="bg-red-100 text-red-600 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase border border-red-200">
                  -20% Preorder Rabatt
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key="selection-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Size Selection */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider">Größe wählen</h3>
                      <button
                        type="button"
                        onClick={() => setShowSizeTable(true)}
                        className="text-xs text-neutral-500 underline underline-offset-4 hover:text-neutral-900 transition-colors"
                      >
                        Größentabelle
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${selectedSize === size
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
                            }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
                      Farbe: <span className="text-neutral-500 font-normal">{selectedColor.name}</span>
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {COLORS.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`w-12 h-12 rounded-full p-1 transition-all duration-200 ${selectedColor.id === color.id
                            ? 'ring-2 ring-neutral-900 ring-offset-2'
                            : 'ring-1 ring-neutral-200 hover:ring-neutral-400'
                            }`}
                          aria-label={color.name}
                        >
                          <div
                            className="w-full h-full rounded-full border border-black/10"
                            style={color.style}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pre-Order Form */}
                  <div className="pt-6 border-t border-neutral-200">
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Vorbestellung abschließen</h3>
                    <form onSubmit={handlePreOrder} className="space-y-4">
                      <button
                        type="submit"
                        disabled={isOrdering}
                        className="w-full mt-4 bg-neutral-900 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 focus:ring-4 focus:ring-neutral-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isOrdering ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <ShoppingBag className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <>
                            Jetzt Vorbestellen <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                      <p className="text-xs text-center text-neutral-500 mt-4">
                        Da es sich um eine Vorbestellung handelt, wird die Lieferung ca. 1-2 Monate dauern.
                      </p>
                    </form>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Size Table Modal */}
      <AnimatePresence>
        {showSizeTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSizeTable(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                <h3 className="text-xl font-bold">Größentabelle</h3>
                <button
                  type="button"
                  onClick={() => setShowSizeTable(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-auto bg-neutral-50">
                <img
                  src={sizeTableImg}
                  alt="Größentabelle Trainerhosen zurrue"
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              </div>
              <div className="p-6 border-t border-neutral-100 bg-white text-center">
                <p className="text-sm text-neutral-500">
                  Alle Maße sind in cm angegeben. Bei Fragen melde dich gerne bei uns.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
//test