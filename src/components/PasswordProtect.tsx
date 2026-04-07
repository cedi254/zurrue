import React, { useState, useEffect } from 'react';

const PASSWORD_KEY = 'site_access_password';
const CORRECT_PASSWORD = '57umme';

export default function PasswordProtect({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const savedPassword = sessionStorage.getItem(PASSWORD_KEY);
        if (savedPassword === CORRECT_PASSWORD) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === CORRECT_PASSWORD) {
            sessionStorage.setItem(PASSWORD_KEY, password);
            setIsAuthenticated(true);
        } else {
            setError('Falsches Passwort');
            setPassword('');
        }
    };

    // Prevent flash of content before checking session storage
    if (!isMounted) return null;

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-white font-sans">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Geschützter Bereich</h1>
                    <p className="text-neutral-400 text-sm">Bitte gib das Passwort ein, um diese Seite zu sehen.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Passwort"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors"
                            autoFocus
                        />
                        {error && <p className="mt-2 text-red-500 text-sm text-center">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-neutral-200 transition-colors"
                    >
                        Eintreten
                    </button>
                </form>
            </div>
        </div>
    );
}
