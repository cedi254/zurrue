import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, ArrowRight, XCircle } from 'lucide-react';

interface PasswordGateProps {
    children: React.ReactNode;
}

const CORRECT_PASSWORD = '57umme';

export const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const authStatus = localStorage.getItem('isAuthorized');
        if (authStatus === 'true') {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(false);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === CORRECT_PASSWORD) {
            localStorage.setItem('isAuthorized', 'true');
            setIsAuthorized(true);
            setError(false);
        } else {
            setError(true);
            setPassword('');
            // Reset error after animation
            setTimeout(() => setError(false), 2000);
        }
    };

    if (isAuthorized === null) return null;

    if (isAuthorized) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full"
            >
                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    {/* Decorative background elements */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-neutral-800/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-neutral-800/30 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 border border-neutral-700 shadow-inner">
                            <Shield className="w-8 h-8 text-white" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Eingeschränkter Zugriff</h1>
                        <p className="text-neutral-400 text-sm mb-8">
                            Bitte gib das Passwort ein, um auf die zurrue Pre-Order Seite zuzugreifen.
                        </p>

                        <form onSubmit={handleSubmit} className="w-full space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-white transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Passwort eingeben"
                                    className={`w-full bg-neutral-800 border ${error ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-neutral-700'
                                        } text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all placeholder:text-neutral-600`}
                                    autoFocus
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all"
                            >
                                Eintreten <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </form>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-4 flex items-center gap-2 text-red-500 text-sm font-medium"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>Falsches Passwort. Bitte versuche es erneut.</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <p className="text-center mt-8 text-neutral-600 text-xs tracking-widest uppercase">
                    &copy; 2026 zurrue - Premium Streetwear
                </p>
            </motion.div>
        </div>
    );
};
