import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu, LayoutDashboard, Key, Bot, HelpCircle, ArrowRight,
    ArrowLeft, CheckCircle2, Loader2, AlertCircle, Building2
} from 'lucide-react';
import Button from '../components/Button';
import { cn } from '../styles/utils';
import { oddityClient } from '../lib/oddityClient';
import { authClient } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────
// Mini Toast System (no external dependencies)
// ─────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }

let toastCount = 0;
const useToasts = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++toastCount;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);
    return { toasts, addToast };
};

const ToastContainer: React.FC<{ toasts: Toast[] }> = ({ toasts }) => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
            {toasts.map(t => (
                <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: 32, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 32, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-sm shadow-lg border text-sm font-semibold max-w-xs backdrop-blur-sm",
                        t.type === 'success' && "bg-emerald-900/90 border-emerald-500/30 text-emerald-300",
                        t.type === 'error' && "bg-red-900/90 border-red-500/30 text-red-300",
                        t.type === 'info' && "bg-slate-900/90 border-white/10 text-slate-200",
                    )}
                >
                    {t.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    {t.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
                    {t.type === 'info' && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
                    <span>{t.message}</span>
                </motion.div>
            ))}
        </AnimatePresence>
    </div>
);

// ─────────────────────────────────────────────
// Main Onboarding
// ─────────────────────────────────────────────
const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const { toasts, addToast } = useToasts();

    const [step, setStep] = useState(1);
    const [accessCode, setAccessCode] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    const [linkedOrg, setLinkedOrg] = useState<any>(null);
    const [linkedAgents, setLinkedAgents] = useState<any[]>([]);

    const handleLinkOrganization = async () => {
        if (accessCode.trim().length < 6 || isLinking) return;
        setIsLinking(true);
        addToast('Verificando código de acceso...', 'info');

        try {
            const session = await authClient.getSession();
            const userId = session?.data?.user?.id;
            if (!userId) throw new Error('Sesión no encontrada. Por favor inicia sesión de nuevo.');

            const res = await oddityClient.organization.link(accessCode.trim().toUpperCase(), userId);
            setLinkedOrg(res.organization);
            setLinkedAgents(res.agents);
            addToast(`✓ Vinculado a ${res.organization.name}`, 'success');
            // Auto advance to next step
            setTimeout(() => setStep(4), 600);
        } catch (err: any) {
            const msg = err?.message || 'Error desconocido';
            if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no valid') || msg.toLowerCase().includes('válido')) {
                addToast('Código inválido. No pertenece a ninguna organización.', 'error');
            } else {
                addToast(msg, 'error');
            }
        } finally {
            setIsLinking(false);
        }
    };

    const nextStep = () => {
        if (step === 3) {
            handleLinkOrganization();
            return;
        }
        setStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const isNextDisabled = (step === 3 && accessCode.trim().length < 6) || isLinking;

    const steps = [
        {
            id: 1,
            title: "Bienvenido a Oddity",
            description: "Estamos listos para transformar tu operación con inteligencia artificial. Deja que te guiemos en tus primeros pasos.",
            icon: Cpu,
        },
        {
            id: 2,
            title: "Tu Nuevo Panel",
            description: "Al entrar, verás el panel de administrador. Usa la barra de navegación lateral para gestionar tu organización.",
            icon: LayoutDashboard,
            component: (
                <div className="w-full bg-slate-50 dark:bg-white/5 rounded-sm p-4 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-3 bg-secondary dark:bg-dark p-3 rounded-sm border border-white/10">
                        <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center">
                            <Cpu className="w-3.5 h-3.5 text-secondary" />
                        </div>
                        <div className="h-3 w-28 bg-white/20 rounded-sm" />
                        <div className="ml-auto w-7 h-7 rounded-sm bg-white/10" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="h-20 bg-white/5 rounded-sm border border-white/5" />
                        <div className="h-20 bg-white/5 rounded-sm border border-white/5" />
                    </div>
                </div>
            )
        },
        {
            id: 3,
            title: "Código de Acceso",
            description: "Para comenzar a operar, introduce el código de acceso proporcionado por el administrador de tu empresa.",
            icon: Key,
            component: (
                <div className="w-full space-y-3">
                    <input
                        type="text"
                        placeholder="XXXXXX"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        onKeyDown={e => { if (e.key === 'Enter') handleLinkOrganization(); }}
                        disabled={isLinking}
                        className="w-full bg-white/5 border border-white/10 rounded-sm py-3.5 px-5 text-center text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors tracking-[0.35em] uppercase font-mono disabled:opacity-50"
                    />
                    {isLinking ? (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Verificando código...
                        </motion.div>
                    ) : accessCode.trim().length >= 6 && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                            <CheckCircle2 className="w-4 h-4" /> Listo para vincular
                        </motion.div>
                    )}
                </div>
            )
        },
        {
            id: 4,
            title: linkedOrg ? `Organización: ${linkedOrg.name}` : "Gestiona tus Agentes",
            description: linkedOrg
                ? `Estás vinculado a ${linkedOrg.name}. Tienes acceso a ${linkedAgents.length} agente(s).`
                : "Selecciona cualquier agente para activarlo.",
            icon: linkedOrg ? Building2 : Bot,
            component: linkedAgents.length > 0 ? (
                <div className="w-full grid grid-cols-2 gap-4">
                    {linkedAgents.map((agent) => (
                        <div key={agent.id} className="relative group p-5 bg-primary/8 border border-primary/20 rounded-sm flex flex-col items-center gap-3 cursor-pointer">
                            <div className="absolute top-2.5 right-2.5 p-1.5 bg-secondary dark:bg-dark rounded-sm border border-white/10 hover:bg-primary transition-colors">
                                <HelpCircle className="w-3.5 h-3.5 text-primary group-hover:text-secondary" />
                            </div>
                            <Bot className="w-9 h-9 text-primary" />
                            <span className="text-xs font-bold opacity-80 tracking-tight text-center">{agent.name}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-full grid grid-cols-2 gap-4">
                    <div className="relative group p-5 bg-primary/8 border border-primary/20 rounded-sm flex flex-col items-center gap-3 cursor-pointer">
                        <div className="absolute top-2.5 right-2.5 p-1.5 bg-secondary dark:bg-dark rounded-sm border border-white/10 hover:bg-primary transition-colors">
                            <HelpCircle className="w-3.5 h-3.5 text-primary group-hover:text-secondary" />
                        </div>
                        <Bot className="w-9 h-9 text-primary" />
                        <span className="text-xs font-bold opacity-60">AGENTE A</span>
                    </div>
                    <div className="p-5 bg-white/5 border border-white/5 rounded-sm flex flex-col items-center gap-3 opacity-30">
                        <Bot className="w-9 h-9" />
                        <span className="text-xs font-bold">AGENTE B</span>
                    </div>
                </div>
            )
        }
    ];

    const currentStep = steps.find(s => s.id === step)!;

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-6">
            <ToastContainer toasts={toasts} />

            <div className="w-full max-w-lg relative">
                {/* Progress Bar */}
                <div className="absolute -top-10 left-0 w-full h-0.5 bg-white/8">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / steps.length) * 100}%` }}
                        className="h-full bg-primary"
                    />
                </div>

                {/* Step counter */}
                <div className="absolute -top-7 right-0 text-[10px] font-black uppercase tracking-widest opacity-30">
                    {step} / {steps.length}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-[#0D0D0D] border border-slate-200 dark:border-white/8 rounded-sm p-8 md:p-10 shadow-xl text-center"
                    >
                        <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center mx-auto mb-6 border border-primary/20">
                            <currentStep.icon className="w-6 h-6 text-primary" />
                        </div>

                        <h2 className="text-2xl font-bold mb-3 tracking-tight">
                            {currentStep.title}
                        </h2>

                        <p className="opacity-50 text-sm leading-relaxed mb-8 mx-auto max-w-sm">
                            {currentStep.description}
                        </p>

                        {currentStep.component && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-8"
                            >
                                {currentStep.component}
                            </motion.div>
                        )}

                        <div className="flex items-center justify-between gap-4">
                            {step > 1 ? (
                                <button
                                    onClick={prevStep}
                                    disabled={isLinking}
                                    className="p-3 rounded-sm border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-40"
                                >
                                    <ArrowLeft className="w-4 h-4 opacity-40" />
                                </button>
                            ) : (
                                <div className="w-10 h-10" />
                            )}

                            <Button
                                onClick={step === 4 ? () => navigate('/panel') : nextStep}
                                disabled={isNextDisabled}
                                className={cn(
                                    "flex-1 rounded-sm py-3",
                                    isNextDisabled && "opacity-40 cursor-not-allowed"
                                )}
                            >
                                {isLinking ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verificando...</>
                                ) : step === 4 ? (
                                    <>Ir al Panel <ArrowRight className="ml-2 w-4 h-4" /></>
                                ) : step === 3 ? (
                                    <>Vincular Organización <ArrowRight className="ml-2 w-4 h-4" /></>
                                ) : (
                                    <>Siguiente <ArrowRight className="ml-2 w-4 h-4" /></>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Step dots */}
                <div className="flex justify-center gap-1.5 mt-6">
                    {steps.map(s => (
                        <div
                            key={s.id}
                            className={cn(
                                "h-1 rounded-sm transition-all duration-300",
                                s.id === step ? "bg-primary w-6" : "bg-white/15 w-4"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
