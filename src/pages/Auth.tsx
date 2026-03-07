import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';

const Auth: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { handleSignIn, handleSignUp, handleGoogleSignIn, handleMicrosoftSignIn, loading, error } = useAuth();
    const { isAuthenticated } = useApp();

    // Redirigir si la sesión ya existe o acaba de ser creada
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/panel');
        }
    }, [isAuthenticated, navigate]);

    // Determine mode from URL
    const isLoginPath = location.pathname === '/login';
    const [isLogin, setIsLogin] = useState(isLoginPath);

    useEffect(() => {
        setIsLogin(location.pathname === '/login');
    }, [location.pathname]);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        organizationId: 0,
        role: 'user'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: name === 'organizationId' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            await handleSignIn({ email: formData.email, password: formData.password });
        } else {
            await handleSignUp(formData);
        }
    };

    const variants: any = {
        enter: (direction: number) => ({
            x: direction > 0 ? 60 : -60,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 }
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 60 : -60,
            opacity: 0,
            transition: { duration: 0.15 }
        })
    };

    const inputWrapperClasses = "space-y-1.5";
    const labelClasses = "text-[10px] font-black dark:opacity-40 text-slate-500 uppercase ml-1 tracking-[0.15em]";
    const inputClasses = "w-full bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 pl-11 pr-4 py-3 rounded-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all dark:text-white text-secondary placeholder:text-slate-400 font-medium text-sm";

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-6 relative overflow-hidden">
            {/* Subtle background */}
            <div className="absolute top-1/3 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-primary/3 rounded-full blur-[140px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 py-10">
                <AnimatePresence mode="wait" custom={isLogin ? -1 : 1}>
                    <motion.div
                        key={isLogin ? 'login' : 'register'}
                        custom={isLogin ? -1 : 1}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="bg-white dark:bg-[#0D0D0D] border border-slate-200 dark:border-white/8 rounded-sm p-8 md:p-10 shadow-xl"
                    >
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center border border-primary/20">
                                    {isLogin ? <ShieldCheck className="text-primary w-5 h-5" /> : <User className="text-primary w-5 h-5" />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight dark:text-white text-secondary">
                                        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                                    </h2>
                                    <p className="dark:opacity-40 text-slate-500 text-xs font-medium mt-0.5">
                                        {isLogin ? 'Accede a tu ecosistema empresarial' : 'Únete a la plataforma Oddity'}
                                    </p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-slate-100 dark:bg-white/5" />
                        </div>

                        {/* Social Auth */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                disabled={loading}
                                onClick={() => handleGoogleSignIn()}
                                className="flex items-center justify-center gap-2.5 bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 py-2.5 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/8 transition-all cursor-pointer shadow-sm dark:text-white text-secondary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                <span>Google</span>
                            </button>
                            <button
                                disabled={loading}
                                onClick={() => handleMicrosoftSignIn()}
                                className="flex items-center justify-center gap-2.5 bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 py-2.5 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/8 transition-all cursor-pointer shadow-sm dark:text-white text-secondary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <img src="https://www.microsoft.com/favicon.ico" alt="Microsoft" className="w-4 h-4" />
                                <span>Microsoft</span>
                            </button>
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-white/8"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-white dark:bg-[#0D0D0D] px-4 dark:opacity-30 text-slate-500 font-black tracking-[0.25em]">O continúa con email</span>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-5 p-3 bg-red-500/8 border border-red-500/20 rounded-sm text-red-500 text-xs font-bold uppercase tracking-widest"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={inputWrapperClasses}>
                                    <label className={labelClasses}>Nombre Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 text-secondary dark:text-white" />
                                        <input
                                            name="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Nombre Apellido"
                                            className={inputClasses}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            <div className={inputWrapperClasses}>
                                <label className={labelClasses}>Email Corporativo</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 text-secondary dark:text-white" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="usuario@empresa.com"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className={inputWrapperClasses}>
                                <label className={labelClasses}>Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 text-secondary dark:text-white" />
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            {/* Role and Org ID removed - to be handled in onboarding */}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-sm font-black uppercase tracking-[0.15em] mt-2 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? 'Acceder' : 'Crear cuenta'}
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Footer Switch */}
                        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 text-center">
                            <p className="dark:opacity-40 text-slate-500 text-xs">
                                {isLogin ? '¿Aún no tienes acceso?' : '¿Ya tienes una cuenta?'}
                                <button
                                    onClick={() => navigate(isLogin ? '/register' : '/login')}
                                    className="ml-2 text-primary font-black uppercase tracking-widest text-[10px] hover:underline cursor-pointer inline-flex items-center gap-1"
                                >
                                    {isLogin ? (<>Registrarse <ArrowRight size={12} /></>) : (<><ArrowLeft size={12} /> Iniciar sesión</>)}
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Auth;
