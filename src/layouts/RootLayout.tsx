import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useAuth } from '../hooks/useAuth';
import { Menu, X, Cpu, Sun, Moon, ChevronDown, LogOut, LayoutDashboard, Zap } from 'lucide-react';
import { cn } from '../styles/utils';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';

const RootLayout: React.FC = () => {
    const { user, theme, toggleTheme } = useApp();
    const { handleSignIn, logout, loading: authLoading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const location = useLocation();
    const date = new Date();
    const year = date.getFullYear();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
    }, [location]);

    useEffect(() => {
        document.body.className = theme;
    }, [theme]);

    return (
        <div className={cn(
            "min-h-screen flex flex-col transition-colors duration-500",
            theme === 'dark' ? "bg-dark text-custom-white" : "bg-custom-white text-secondary"
        )}>
            {/* Enterprise Navbar */}
            <nav className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300",
                scrolled || user
                    ? (theme === 'dark'
                        ? "bg-secondary/95 backdrop-blur-md border-b border-white/8 shadow-lg"
                        : "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm")
                    : "bg-transparent"
            )}>
                <div className="w-full flex justify-between items-center px-8 h-14">
                    <Link to="/" className="flex items-center gap-2 group">
                        <Cpu className="text-primary w-5 h-5" />
                        <span className="text-lg font-bold tracking-tight">
                            ODDITY<span className="text-primary">.</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6 font-bold text-sm">
                        {!user ? (
                            <>
                                <Link to="/" className="hover:text-primary transition-colors opacity-60 hover:opacity-100">Inicio</Link>
                                <Link to="/about" className="hover:text-primary transition-colors opacity-60 hover:opacity-100">Servicios</Link>
                            </>
                        ) : (
                            <Link to="/panel" className="flex items-center gap-1.5 text-primary hover:opacity-80 transition-all text-sm">
                                <LayoutDashboard size={16} />
                                Panel
                            </Link>
                        )}

                        <div className="flex items-center gap-4 border-l border-current/10 pl-6 ml-2">
                            {/* Dev Quick Login */}
                            {!user && (
                                <button
                                    disabled={authLoading}
                                    onClick={async () => {
                                        await handleSignIn({ email: 'juanmaster0910@gmail.com', password: 'Amoelanime1' });
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-primary/10 text-primary border border-primary/20 text-[9px] uppercase font-black tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                                >
                                    <Zap size={10} fill="currentColor" />
                                    {authLoading ? '...' : 'Dev Login'}
                                </button>
                            )}

                            <button
                                onClick={toggleTheme}
                                className="p-1.5 hover:bg-primary/10 transition-colors cursor-pointer rounded-sm"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-secondary" />}
                            </button>

                            {!user ? (
                                <div className="flex items-center gap-4">
                                    <Link to="/login" className="hover:text-primary transition-colors opacity-60 hover:opacity-100 text-sm">Iniciar Sesión</Link>
                                    <Link to="/register">
                                        <Button variant="primary" size="sm" className="px-4 py-1.5 text-xs">
                                            Registrarse
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div
                                        className="flex items-center gap-2.5 px-3 py-1.5 border border-current/10 rounded-sm cursor-pointer hover:bg-current/5 transition-colors group"
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    >
                                        <div className="w-6 h-6 rounded-sm bg-primary flex items-center justify-center">
                                            <div className="text-white font-bold text-[10px]">{user.name.charAt(0)}</div>
                                        </div>
                                        <span className="text-sm font-bold leading-none">{user.name}</span>
                                        <ChevronDown size={12} className={cn("transition-transform opacity-40", isProfileOpen && "rotate-180")} />
                                    </div>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 6 }}
                                                className="absolute top-full right-0 mt-1.5 w-48 bg-white dark:bg-secondary border border-slate-200 dark:border-white/10 rounded-sm shadow-xl overflow-hidden z-50 text-secondary dark:text-white"
                                            >
                                                <div className="p-1">
                                                    <button
                                                        onClick={logout}
                                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer text-left text-sm font-bold"
                                                    >
                                                        <LogOut size={15} />
                                                        Cerrar Sesión
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Toggle */}
                    <div className="md:hidden flex items-center gap-3">
                        <button onClick={toggleTheme} className="cursor-pointer">
                            {theme === 'dark' ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-secondary" />}
                        </button>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="cursor-pointer">
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={cn(
                    "fixed inset-0 top-14 z-40 transition-transform duration-300 md:hidden",
                    theme === 'dark' ? "bg-secondary" : "bg-white",
                    isMenuOpen ? "translate-x-0" : "translate-x-full"
                )}>
                    <div className="flex flex-col gap-6 pt-12 px-8 text-xl font-bold">
                        {!user ? (
                            <>
                                <Link to="/">Inicio</Link>
                                <Link to="/about">Servicios</Link>
                                <div className="h-px w-8 bg-primary/20 my-1" />
                                <Link to="/login">Iniciar Sesión</Link>
                                <Link to="/register" className="text-primary">Registrarse</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/panel" className="text-primary">Panel</Link>
                                <div className="h-px w-8 bg-primary/20 my-1" />
                                <button onClick={logout} className="text-red-500 text-left">Cerrar Sesión</button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="flex-1 pt-14 min-h-[calc(100vh-3.5rem)]">
                <Outlet />
            </main>

            <AnimatePresence>
                {!user && (
                    <footer className={cn(
                        "py-10 px-8 border-t",
                        theme === 'dark' ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-slate-50/80"
                    )}>
                        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
                            <div>
                                <span className="text-base font-bold tracking-tight text-primary">ODDITY.</span>
                                <p className="mt-2 opacity-50 text-sm max-w-xs">
                                    Impulsando el valor humano a través de la inteligencia artificial.
                                </p>
                            </div>
                            <div className="flex gap-12 text-sm font-bold">
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-xs uppercase tracking-widest opacity-40 mb-1">Plataforma</h4>
                                    <Link to="/" className="opacity-60 hover:text-primary hover:opacity-100 transition-all">Inicio</Link>
                                    <Link to="/about" className="opacity-60 hover:text-primary hover:opacity-100 transition-all">Servicios</Link>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-xs uppercase tracking-widest opacity-40 mb-1">Legal</h4>
                                    <span className="opacity-40 text-xs">©{year} Oddity AI</span>
                                </div>
                            </div>
                        </div>
                    </footer>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RootLayout;
