import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Check, Star, Shield, Truck, ArrowRight, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
// Import assets
import logo from './assets/zurrue-logo-transparent.svg';
import sizeTableImg from './assets/Grössentabelle_Trainerhosen_zurrue.png';
import hosenNavy from './assets/zurrue-hosen-navy-white.png';
import hosenGrayBlack from './assets/zurrue-hosen-gray-black.png';
import hosenGrayWhite from './assets/zurrue-hosen-gray-white.jpeg';
import hosenBlackWhite from './assets/zurrue-hosen-black-white.png';
import hosenBlackBlack from './assets/zurrue-hosen-black-black.jpeg';

import { PasswordGate } from './components/PasswordGate';

const COLORS = [
  { id: 'navy', name: 'Navy-Weiß', image: hosenNavy, style: { background: 'radial-gradient(circle, #ffffff 25%, #1e293b 26%)' } },
  { id: 'grau-schwarz', name: 'Grau-Schwarz', image: hosenGrayBlack, style: { background: 'radial-gradient(circle, #000000 25%, #9ca3af 26%)' } },
  { id: 'grau-weiss', name: 'Grau-Weiß', image: hosenGrayWhite, style: { background: 'radial-gradient(circle, #ffffff 25%, #9ca3af 26%)' } },
  { id: 'schwarz-weiss', name: 'Schwarz-Weiß', image: hosenBlackWhite, style: { background: 'radial-gradient(circle, #ffffff 25%, #000000 26%)' } },
  { id: 'schwarz-schwarz', name: 'Schwarz-Schwarz', image: hosenBlackBlack, style: { background: '#000000' } },
];

const SIZES = ['S', 'M', 'L', 'XL'];
const TARGET_DATE = new Date('2026-04-05T00:00:00');

function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const API_URL = `/api/orders`;
      const res = await fetch(API_URL);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleStatus = async (sessionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ausgeführt' ? 'Offen' : 'Ausgeführt';
    try {
      await fetch('/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status: newStatus })
      });
      fetchOrders(); // Neu laden
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8 font-sans">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Bestellverwaltung</h1>
          <button onClick={fetchOrders} className="text-sm bg-white border border-neutral-200 px-4 py-2 rounded-lg hover:bg-neutral-50">Aktualisieren</button>
        </div>

        {loading ? (
          <p className="text-neutral-500 text-center py-12">Lade Bestellungen...</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-neutral-500">Datum</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-neutral-500">Kunde</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-neutral-500">Hose</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-neutral-500">Strasse & Nr.</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-neutral-500">PLZ</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-neutral-500">Stadt</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-neutral-500">Land</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-neutral-500">Zahlung</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-neutral-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.map((order, i) => (
                    <tr key={order.id || i} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4 text-sm text-neutral-600 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('de-CH')}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="font-semibold text-neutral-900">{order.customer_name}</div>
                        <div className="text-xs text-neutral-500">{order.customer_email}</div>
                      </td>
                      <td className="p-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {order.items?.size} | {order.items?.color}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-neutral-700">
                        {order.street} {order.house_number}
                      </td>
                      <td className="p-4 text-sm text-neutral-700 font-mono">{order.zip_code}</td>
                      <td className="p-4 text-sm text-neutral-700">{order.city}</td>
                      <td className="p-4 text-sm text-neutral-700 uppercase">{order.country}</td>
                      <td className="p-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${order.payment_status === 'paid' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <button
                          onClick={() => toggleStatus(order.stripe_session_id, order.status)}
                          className={`w-full text-center px-4 py-2 rounded-lg text-xs font-semibold transition-all ${order.status === 'Ausgeführt'
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-900'}`}
                        >
                          {order.status || 'Offen'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-neutral-400 italic">
                        Noch keine Bestellungen im System.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

function ProductGallery({ selectedColor, onColorChange }: { selectedColor: any, onColorChange: (color: any) => void }) {
  const index = COLORS.findIndex(c => c.id === selectedColor.id);

  const paginate = (newDirection: number) => {
    const nextIndex = (index + newDirection + COLORS.length) % COLORS.length;
    onColorChange(COLORS[nextIndex]);
  };

  return (
    <div className="relative aspect-[4/5] bg-neutral-100 rounded-3xl overflow-hidden shadow-2xl group">
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={selectedColor.id}
          src={selectedColor.image}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_e, { offset }) => {
            if (offset.x > 50) paginate(-1);
            else if (offset.x < -50) paginate(1);
          }}
          className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
        />
      </AnimatePresence>

      <button
        onClick={() => paginate(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden lg:block hover:bg-white"
        aria-label="Vorheriges Bild"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden lg:block hover:bg-white"
        aria-label="Nächstes Bild"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {COLORS.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-neutral-900 w-4' : 'bg-neutral-400/50'}`}
          />
        ))}
      </div>

      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm z-10 border border-neutral-200">
        Pre-Order Offen
      </div>
    </div>
  );
}

function MainApp() {
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isOrdering, setIsOrdering] = useState(false);
  const [showSizeTable, setShowSizeTable] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = TARGET_DATE.getTime() - now;
      setTimeLeft(Math.max(0, Math.floor(distance / 1000)));
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return {
      total: seconds,
      days: d,
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0')
    };
  };

  const handlePreOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOrdering(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          size: selectedSize,
          colorName: selectedColor.name,
          colorId: selectedColor.id
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (error: any) {
      console.error('Checkout Error:', error);
      alert(`Stripe Fehler: ${error.message}`);
      setIsOrdering(false);
    }
  };

  const time = formatTime(timeLeft);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Banner */}
      <div className="bg-neutral-900 text-white py-3 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-sm font-medium">
          <Clock className="w-4 h-4 text-neutral-400" />
          <span className="hidden sm:inline opacity-80">Der Pre-Order Sale endet in:</span>
          <div className="flex gap-2 font-mono text-base tracking-tighter">
            <span className="bg-white/10 px-1.5 py-0.5 rounded">{time.days}d</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded">{time.hours}h</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded">{time.minutes}m</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-red-400">{time.seconds}s</span>
          </div>
        </div>
      </div>

      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <img src={logo} alt="zurrue" className="h-8 lg:h-10 w-auto" />
        <div className="flex items-center gap-6">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Exclusive Drop 2026</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <ProductGallery selectedColor={selectedColor} onColorChange={setSelectedColor} />

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