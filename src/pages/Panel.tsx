import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import {
    PlusCircle,
    Cpu,
    FileSpreadsheet,
    Upload,
    ArrowRight,
    Users,
    RefreshCw,
    Loader2,
    ShieldCheck,
    Pencil,
    Check,
    X,
    User,
    Calendar,
    Briefcase,
    Trash2,
    Bot,
    Paperclip,
    CheckCircle2,
    AlertCircle,
    Info
} from 'lucide-react';
import { oddityClient } from '../lib/oddityClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import Sidebar from '../components/Sidebar';
import type { ViewId } from '../components/Sidebar';
import Button from '../components/Button';
import { cn } from '../styles/utils';
import { useAdminUsers, type UserRole, ASSIGNABLE_ROLES, ROLE_LABELS, useUpdateUser } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { usePanelData } from '../hooks/usePanelData';
import type { UserData } from '../lib/types';

// ─────────────────────────────────────────────
// Toast System
// ─────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'progress';
interface Toast { id: number; message: string; type: ToastType; }

let _toastId = 0;
const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => { });
export const usePanelToast = () => useContext(ToastContext);

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
                        "flex items-center gap-3 px-4 py-3 rounded-sm shadow-lg border text-xs font-bold max-w-xs backdrop-blur-sm",
                        t.type === 'success' && "bg-emerald-950/95 border-emerald-500/30 text-emerald-300",
                        t.type === 'error' && "bg-red-950/95 border-red-500/30 text-red-300",
                        t.type === 'info' && "bg-slate-900/95 border-white/10 text-slate-200",
                        t.type === 'progress' && "bg-primary/10 border-primary/30 text-primary",
                    )}
                >
                    {t.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    {t.type === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    {t.type === 'info' && <Info className="w-3.5 h-3.5 shrink-0" />}
                    {t.type === 'progress' && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />}
                    <span>{t.message}</span>
                </motion.div>
            ))}
        </AnimatePresence>
    </div>
);

export const Panel: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeView, setActiveView] = useState<ViewId>('user-data');
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((msg: string, type: ToastType = 'info') => {
        const id = ++_toastId;
        setToasts(prev => [...prev, { id, message: msg, type }]);
        const ttl = type === 'progress' ? 3500 : 5000;
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), ttl);
    }, []);

    const formVariants: any = {
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
    };

    const inputClasses = "w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm py-3 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-secondary dark:text-white text-sm";
    const labelClasses = "text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/40 mb-2 block";
    const cardClasses = "bg-white dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-sm shadow-sm";
    const { theme } = useApp();

    const renderContent = () => {
        if (typeof activeView === 'string' && activeView.startsWith('agent-')) {
            const agentId = activeView.split('-')[1];
            return <AgentChatView key={activeView} agentId={agentId} formVariants={formVariants} inputClasses={inputClasses} cardClasses={cardClasses} addToast={addToast} />;
        }

        switch (activeView) {

            case 'super-agents':
                return <SuperAgentsView key="super-agents" formVariants={formVariants} cardClasses={cardClasses} inputClasses={inputClasses} labelClasses={labelClasses} />;

            case 'org-agents':
                return <OrgAgentsView key="org-agents" formVariants={formVariants} cardClasses={cardClasses} inputClasses={inputClasses} labelClasses={labelClasses} />;

            case 'org-info':
                return <OrgInfoView key="org-info" formVariants={formVariants} cardClasses={cardClasses} />;

            case 'org-usage':
                return <OrgUsageView key="org-usage" formVariants={formVariants} cardClasses={cardClasses} inputClasses={inputClasses} />;

            case 'super-models':
                return <SuperModelsView key="super-models" formVariants={formVariants} cardClasses={cardClasses} inputClasses={inputClasses} labelClasses={labelClasses} />;

            case 'user-data':
                return <UserDataView key="user-data" formVariants={formVariants} cardClasses={cardClasses} inputClasses={inputClasses} labelClasses={labelClasses} />;

            case 'super-orgs':
                return <SuperOrgsView key="super-orgs" formVariants={formVariants} cardClasses={cardClasses} inputClasses={inputClasses} labelClasses={labelClasses} />;

            case 'super-users': {
                return <SuperUsersView key="super-users" formVariants={formVariants} cardClasses={cardClasses} />;
            }

            default:
                return (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                        <Cpu size={80} className="mb-6 opacity-30" />
                        <p className="font-black uppercase tracking-[0.5em] text-sm">Módulo en Desarrollo</p>
                    </div>
                );
        }
    };

    return (
        <ToastContext.Provider value={addToast}>
            <div className={cn("flex h-[calc(100vh-3.5rem)] overflow-hidden", theme === 'light' ? 'bg-slate-100' : 'bg-transparent')}>
                <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} activeView={activeView} setActiveView={setActiveView} />

                <main className={cn("flex-1 overflow-y-auto p-8 transition-all duration-300 custom-scrollbar", theme === 'light' ? 'bg-slate-100' : 'surface-panel')}>
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                </main>

                <ToastContainer toasts={toasts} />
            </div>
        </ToastContext.Provider>
    );
};

function UserDataView({ formVariants, cardClasses, inputClasses, labelClasses }: { formVariants: any; cardClasses: string; inputClasses: string; labelClasses: string }) {
    const { user: rawUser } = useApp();
    const user = rawUser as UserData | null;
    const { updateName, loading, success, error } = useUpdateUser();

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameVal, setNameVal] = useState(user?.name || '');

    const handleSaveName = async () => {
        if (nameVal === user?.name) {
            setIsEditingName(false);
            return;
        }
        const ok = await updateName(nameVal);
        if (ok) {
            setIsEditingName(false);
        }
    };

    const handleCancelName = () => {
        setNameVal(user?.name || '');
        setIsEditingName(false);
    };

    const roleLabel = user?.role ? ROLE_LABELS[user.role as UserRole] ?? 'Usuario' : 'Usuario';

    return (
        <motion.div key="user-data" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-2xl mx-auto">
            <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Mis Datos</h2>
                </div>
                <p className="text-sm opacity-40 ml-4 mt-1">Gestiona tu información personal y de acceso.</p>
            </header>

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest">
                    {error}
                </motion.div>
            )}

            {success && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Check size={14} /> Nombre actualizado correctamente.
                </motion.div>
            )}

            <div className={cn(cardClasses, "p-6 space-y-6")}>

                {/* Editable Name */}
                <div className="space-y-2">
                    <label className={labelClasses}>Nombre Completo</label>
                    <div className="flex items-center gap-3">
                        {isEditingName ? (
                            <input
                                type="text"
                                value={nameVal}
                                onChange={(e) => setNameVal(e.target.value)}
                                className={cn(inputClasses, "flex-1")}
                                autoFocus
                                disabled={loading}
                            />
                        ) : (
                            <div className="flex-1 bg-slate-50 dark:bg-white/5 border border-transparent rounded-sm py-3 px-4 text-sm font-medium flex items-center">
                                <User size={16} className="opacity-40 mr-3" />
                                {user?.name}
                            </div>
                        )}

                        {isEditingName ? (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleSaveName}
                                    disabled={loading}
                                    className="p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                </button>
                                <button
                                    onClick={handleCancelName}
                                    disabled={loading}
                                    className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-secondary dark:text-white rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="p-3 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-sm transition-colors cursor-pointer opacity-60 hover:opacity-100"
                            >
                                <Pencil size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />

                {/* Read-only Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className={labelClasses}>Correo Electrónico</label>
                        <div className="bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-sm py-3 px-4 text-sm font-medium opacity-60">
                            {user?.email}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClasses}>Rol en Plataforma</label>
                        <div className="bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-sm py-3 px-4 text-sm font-medium opacity-60 flex items-center gap-2">
                            <Briefcase size={14} className="opacity-40" />
                            {roleLabel}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClasses}>ID de Organización</label>
                        <div className="bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-sm py-3 px-4 text-sm font-medium opacity-60 font-mono">
                            {user?.organizationId ?? 'N/A'}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClasses}>Fecha de Registro</label>
                        <div className="bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-sm py-3 px-4 text-sm font-medium opacity-60 flex items-center gap-2">
                            <Calendar size={14} className="opacity-40" />
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
    user: { label: 'Usuario', color: 'bg-slate-500/15 text-slate-400' },
    admin: { label: 'Admin', color: 'bg-primary/15 text-primary' },
    superadmin: { label: 'Super Admin', color: 'bg-purple-500/15 text-purple-400' },
};

function SuperUsersView({ formVariants, cardClasses }: { formVariants: any; cardClasses: string }) {
    const { user } = useApp();
    const callerRole = (user?.role as UserRole) ?? 'user';
    const { users, loading, updatingId, error, fetchUsers, setRole } = useAdminUsers(callerRole);
    const assignableRoles = ASSIGNABLE_ROLES[callerRole] ?? [];

    return (
        <motion.div key="super-users" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto">
            <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary" />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Gestionar Usuarios</h2>
                        <p className="text-sm opacity-40 ml-0 mt-0.5">Asigna roles a los miembros de la plataforma</p>
                    </div>
                </div>
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50 cursor-pointer"
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Refrescar
                </button>
            </header>

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest">
                    {error}
                </motion.div>
            )}

            <div className={cn(cardClasses, "overflow-hidden")}>
                {/* Table header */}
                <div className="grid grid-cols-[auto_1fr_1fr_180px] gap-4 px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2">
                    <div className="w-8" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Usuario</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Fecha Alta</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Rol</span>
                </div>

                {loading && users.length === 0 ? (
                    <div className="flex items-center justify-center py-20 gap-3 opacity-40">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="font-bold">Cargando usuarios...</span>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-4">
                        <Users size={48} />
                        <p className="font-bold">No hay usuarios registrados</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {users.map((user) => {
                            const role = (user.role as UserRole) || 'user';
                            const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG.user;
                            const isUpdating = updatingId === user.id;

                            return (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="grid grid-cols-[auto_1fr_1fr_180px] gap-4 items-center px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                                        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                                    </div>

                                    {/* User info */}
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">{user.name}</p>
                                        <p className="text-xs opacity-40 truncate">{user.email}</p>
                                    </div>

                                    {/* Date */}
                                    <div className="text-xs opacity-40 font-medium">
                                        {new Date(user.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>

                                    {/* Role selector */}
                                    <div className="relative flex items-center gap-2">
                                        {isUpdating ? (
                                            <div className="flex items-center gap-2 opacity-50">
                                                <Loader2 size={14} className="animate-spin" />
                                                <span className="text-xs font-bold">Guardando...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className={cn('text-[9px] font-black px-2 py-0.5 uppercase tracking-wider', roleConfig.color)}>
                                                    {roleConfig.label}
                                                </span>
                                                {assignableRoles.length > 0 ? (
                                                    <select
                                                        value={role}
                                                        onChange={(e) => setRole(user.id, e.target.value as UserRole)}
                                                        className="appearance-none bg-transparent border border-slate-200 dark:border-white/10 hover:border-primary/40 px-2 py-1.5 text-xs font-bold outline-none cursor-pointer transition-all focus:border-primary"
                                                    >
                                                        {assignableRoles.map(r => (
                                                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-[9px] opacity-30 uppercase tracking-widest">Sólo lectura</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs opacity-30">
                <ShieldCheck size={12} />
                <span>{users.length} usuario{users.length !== 1 ? 's' : ''}</span>
            </div>
        </motion.div>
    );
};

function SuperAgentsView({ formVariants, cardClasses, inputClasses, labelClasses }: any) {
    const { createCustomAgent, loading: createLoading, error, success, setError, setSuccess } = usePanelData();
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState<boolean | number | string>(false);

    const [name, setName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [organizationId, setOrganizationId] = useState('');
    const [mode, setMode] = useState<"CHAT" | "FILE" | "IMAGE" | "VIDEO">('CHAT');
    const [modelId, setModelId] = useState('');
    const [expectedOutput, setExpectedOutput] = useState<"text" | "excel" | "pdf">('text');

    const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);

    const handleAnalyzeFileForPrompt = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0 || !modelId) {
            setError("Selecciona un modelo primero para analizar el archivo");
            return;
        }
        setIsAnalyzingFile(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('files', acceptedFiles[0]);
            formData.append('modelId', modelId.toString());
            const res = await oddityClient.customAgent.analyzeToPrompt(formData);
            const text = res.text || res.message || "";
            if (text) {
                setSystemPrompt(prev => prev + "\n\n[CONTEXTO_DOCUMENTO_ANALIZADO]:\n" + text);
                setSuccess("Archivo analizado e integrado al System Prompt.");
            }
        } catch (e: any) {
            setError("Error: " + e.message);
        } finally {
            setIsAnalyzingFile(false);
        }
    };

    const dropzone = useDropzone({
        onDrop: handleAnalyzeFileForPrompt,
        multiple: false,
        noClick: true
    });

    const [organizations, setOrganizations] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const selectClasses = cn(inputClasses, "dark:bg-[#0A0A0A] dark:text-white appearance-none");

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            oddityClient.customAgent.findAll(),
            oddityClient.organization.findAll(),
            oddityClient.iaModel.findAll()
        ]).then(([ag, orgs, mods]) => {
            setAgents(ag);
            setOrganizations(orgs);
            setModels(mods);
        }).catch(() => setError("Error cargando datos"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async () => {
        if (!name || !systemPrompt || !organizationId || !modelId) return;

        let res;
        if (typeof isAdding === 'number') {
            res = await oddityClient.customAgent.update(isAdding, {
                name, systemPrompt, organizationId: Number(organizationId), mode, modelId: Number(modelId), expectedOutput
            });
            setSuccess("Agente actualizado");
        } else {
            res = await createCustomAgent({
                name, systemPrompt, organizationId: Number(organizationId), mode, modelId: Number(modelId), isActive: true, expectedOutput
            });
        }

        if (res) {
            setIsAdding(false); fetchData(); setName(''); setSystemPrompt(''); setOrganizationId(''); setModelId('');
            window.dispatchEvent(new Event('oddity:agent-updated'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Seguro que deseas eliminar este agente?")) return;
        try {
            await oddityClient.customAgent.remove(id);
            setAgents(prev => prev.filter(a => a.id !== id));
            setSuccess("Agente eliminado");
            window.dispatchEvent(new Event('oddity:agent-updated'));
        } catch (e: any) { setError(e.message || "Error al eliminar"); }
    };

    if (isAdding) {
        return (
            <motion.div key="add-agent" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-3xl mx-auto">
                <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-primary" />
                            <h2 className="text-2xl font-bold tracking-tight">{typeof isAdding === 'number' ? 'Editar Agente' : 'Crear Agente Custom'}</h2>
                        </div>
                        <p className="text-sm opacity-40 ml-4 mt-1">Define un nuevo comportamiento de IA especializado.</p>
                    </div>
                    <Button onClick={() => { setIsAdding(false); setName(''); setSystemPrompt(''); setOrganizationId(''); setModelId(''); }} className="bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20">
                        Volver
                    </Button>
                </header>

                {error && <motion.div className="mb-4 p-3 bg-red-500/10 text-red-500 text-xs font-bold">{error}</motion.div>}
                {success && <motion.div className="mb-4 p-3 bg-green-500/10 text-green-500 text-xs font-bold">{success}</motion.div>}

                <div className={cn(cardClasses, "p-6 space-y-5")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className={labelClasses}>Nombre del Agente</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Experto Legal" className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Organización Vinculada</label>
                            <select value={organizationId} onChange={e => setOrganizationId(e.target.value)} className={selectClasses} disabled={loading}>
                                <option value="">Selecciona una organización</option>
                                {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Modo de Agente</label>
                            <select value={mode} onChange={e => setMode(e.target.value as any)} className={selectClasses}>
                                <option value="CHAT">Chat (Interacción de Texto)</option>
                                <option value="FILE">Archivo (Análisis y Extracción)</option>
                                <option value="IMAGE">Imagen (Visión AI)</option>
                                <option value="VIDEO">Video</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Modelo Base LLM</label>
                            <select value={modelId} onChange={e => setModelId(e.target.value)} className={selectClasses} disabled={loading}>
                                <option value="">Selecciona el Modelo</option>
                                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Salida Esperada</label>
                            <select value={expectedOutput} onChange={e => setExpectedOutput(e.target.value as any)} className={selectClasses}>
                                <option value="text">Texto</option>
                                <option value="excel">Excel (.xlsx)</option>
                                <option value="pdf">PDF (.pdf)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className={labelClasses}>System Prompt</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => dropzone.open()}
                                        className="text-[9px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 hover:opacity-70 transition-all cursor-pointer bg-primary/5 px-2 py-1 rounded-sm border border-primary/10"
                                    >
                                        <Paperclip size={10} /> Añadir Clip
                                    </button>
                                </div>
                            </div>

                            <div
                                {...dropzone.getRootProps()}
                                className={cn(
                                    "relative group transition-all",
                                    dropzone.isDragActive ? "ring-2 ring-primary ring-offset-2 rounded-sm" : ""
                                )}
                            >
                                <input {...dropzone.getInputProps()} />
                                <textarea
                                    value={systemPrompt}
                                    onChange={e => setSystemPrompt(e.target.value)}
                                    rows={8}
                                    placeholder="Instrucciones del agente... Tip: Suelta un archivo aquí para analizarlo y anexarlo al prompt."
                                    className={cn(inputClasses, "resize-none leading-relaxed transition-colors", dropzone.isDragActive ? "bg-primary/5 border-primary" : "")}
                                />
                                {isAnalyzingFile && (
                                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-sm z-10 transition-all">
                                        <Loader2 size={24} className="animate-spin text-primary mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Analizando Documento...</span>
                                    </div>
                                )}
                                {dropzone.isDragActive && !isAnalyzingFile && (
                                    <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center rounded-sm z-10 pointer-events-none">
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="text-primary animate-bounce" />
                                            <span className="text-xs font-bold text-primary uppercase tracking-tighter">Soltar para analizar anexar</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                        <Button onClick={handleSubmit} disabled={createLoading} className="rounded-sm px-6 py-2.5 text-sm font-bold uppercase tracking-wider">
                            {createLoading ? 'Guardando...' : <>Desplegar Agente <PlusCircle className="ml-2 w-4 h-4" /></>}
                        </Button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div key="list-agents" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto">
            <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary" />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Agentes Custom</h2>
                        <p className="text-sm opacity-40 ml-0 mt-0.5">Listado de todos los asistentes desplegados.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                    <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2 pl-3">
                        <PlusCircle size={14} /> Añadir
                    </Button>
                </div>
            </header>

            {error && <motion.div className="mb-4 p-3 bg-red-500/10 text-red-500 text-xs font-bold">{error}</motion.div>}
            {success && <motion.div className="mb-4 p-3 bg-green-500/10 text-green-500 text-xs font-bold">{success}</motion.div>}

            <div className={cn(cardClasses, "overflow-hidden")}>
                <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Agente</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Acciones</span>
                </div>
                {loading && agents.length === 0 ? (
                    <div className="flex items-center justify-center py-20 opacity-40"><Loader2 className="animate-spin" /></div>
                ) : agents.length === 0 ? (
                    <div className="p-10 text-center opacity-40 font-bold">No hay agentes registrados</div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {agents.map(a => (
                            <div key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                                <div>
                                    <p className="font-bold text-sm">{a.name}</p>
                                    <p className="text-xs opacity-40">Org: {a.organizationId} | Mode: {a.mode || 'CHAT'}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={async () => {
                                            const details = await oddityClient.customAgent.findOne(a.id);
                                            setName(details.name);
                                            setSystemPrompt(details.systemPrompt);
                                            setOrganizationId(details.organizationId.toString());
                                            setMode(details.mode || 'CHAT');
                                            setModelId(details.modelId?.toString() || '');
                                            setExpectedOutput(details.expectedOutput || 'text');
                                            setIsAdding(a.id);
                                        }}
                                        className="p-2 text-primary hover:bg-primary/10 transition-colors rounded-sm cursor-pointer"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-500/10 transition-colors rounded-sm cursor-pointer">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function OrgAgentsView({ formVariants, cardClasses, inputClasses, labelClasses }: any) {
    const { user: rawUser, isSuperAdmin } = useApp();
    const user = rawUser as UserData | null;
    const { createCustomAgent, loading: createLoading, error, success, setError, setSuccess } = usePanelData();
    const [agents, setAgents] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState<boolean | number | string>(false);

    const [name, setName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [mode, setMode] = useState<"CHAT" | "FILE" | "IMAGE" | "VIDEO">('CHAT');
    const [modelId, setModelId] = useState('');
    const [expectedOutput, setExpectedOutput] = useState<"text" | "excel" | "pdf">('text');
    const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
    const selectClasses = cn(inputClasses, "dark:bg-[#0A0A0A] dark:text-white appearance-none");

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            oddityClient.customAgent.findAll(),
            oddityClient.iaModel.findAll()
        ]).then(([ag, mods]) => {
            setAgents(ag.filter((a: any) => a.organizationId === user?.organizationId));
            setModels(mods);
        }).catch(() => setError("Error cargando datos"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (user?.organizationId) fetchData();
    }, [user?.organizationId]);

    const handleSubmit = async () => {
        if (!name || !systemPrompt || !user?.organizationId || !modelId) return;

        let res;
        if (typeof isAdding === 'number') {
            res = await oddityClient.customAgent.update(isAdding, {
                name, systemPrompt, organizationId: Number(user.organizationId), mode, modelId: Number(modelId), expectedOutput
            });
            setSuccess("Agente actualizado");
        } else {
            res = await createCustomAgent({
                name, systemPrompt, organizationId: Number(user.organizationId), mode, modelId: Number(modelId), isActive: true, expectedOutput
            });
        }

        if (res) {
            setIsAdding(false); fetchData(); setName(''); setSystemPrompt(''); setModelId('');
            window.dispatchEvent(new Event('oddity:agent-updated'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Seguro que deseas eliminar este agente?")) return;
        try {
            await oddityClient.customAgent.remove(id);
            setAgents(prev => prev.filter(a => a.id !== id));
            setSuccess("Agente eliminado");
            window.dispatchEvent(new Event('oddity:agent-updated'));
        } catch (e: any) {
            setError(e.message || "Error al eliminar");
        }
    };

    const handleAnalyzeFileForPrompt = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0 || !modelId) {
            setError("Selecciona un modelo primero para analizar el archivo");
            return;
        }
        setIsAnalyzingFile(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('files', acceptedFiles[0]);
            formData.append('modelId', modelId.toString());
            const res = await oddityClient.customAgent.analyzeToPrompt(formData);
            const text = res.text || res.message || "";
            if (text) {
                setSystemPrompt(prev => prev + "\n\n[CONTEXTO_DOCUMENTO_ANALIZADO]:\n" + text);
                setSuccess("Archivo analizado e integrado al System Prompt.");
            }
        } catch (e: any) {
            setError("Error: " + e.message);
        } finally {
            setIsAnalyzingFile(false);
        }
    };

    const dropzone = useDropzone({
        onDrop: handleAnalyzeFileForPrompt,
        multiple: false,
        noClick: true
    });

    if (isAdding) {
        return (
            <motion.div key="add-org-agent" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-3xl mx-auto">
                <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-primary" />
                            <h2 className="text-2xl font-bold tracking-tight">{typeof isAdding === 'number' ? 'Editar Agente' : 'Crear Agente'}</h2>
                        </div>
                        <p className="text-sm opacity-40 ml-4 mt-1">Define un nuevo comportamiento de IA para la organización.</p>
                    </div>
                    <Button onClick={() => { setIsAdding(false); setName(''); setSystemPrompt(''); setModelId(''); }} className="bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20">
                        Volver
                    </Button>
                </header>

                {error && <motion.div className="mb-4 p-3 bg-red-500/10 text-red-500 text-xs font-bold">{error}</motion.div>}
                {success && <motion.div className="mb-4 p-3 bg-green-500/10 text-green-500 text-xs font-bold">{success}</motion.div>}

                <div className={cn(cardClasses, "p-6 space-y-5")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className={labelClasses}>Nombre del Agente</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Asistente de Ventas" className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Modo de Agente</label>
                            <select value={mode} onChange={e => setMode(e.target.value as any)} className={selectClasses}>
                                <option value="CHAT">Chat (Interacción de Texto)</option>
                                <option value="FILE">Archivo (Análisis y Extracción)</option>
                                <option value="IMAGE">Imagen (Visión AI)</option>
                                <option value="VIDEO">Video</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Modelo Base LLM</label>
                            <select value={modelId} onChange={e => setModelId(e.target.value)} className={selectClasses} disabled={loading}>
                                <option value="">Selecciona el Modelo</option>
                                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Salida Esperada</label>
                            <select value={expectedOutput} onChange={e => setExpectedOutput(e.target.value as any)} className={selectClasses}>
                                <option value="text">Texto</option>
                                <option value="excel">Excel (.xlsx)</option>
                                <option value="pdf">PDF (.pdf)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className={labelClasses}>System Prompt</label>
                                <button
                                    type="button"
                                    onClick={() => dropzone.open()}
                                    className="text-[9px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 hover:opacity-70 transition-all cursor-pointer bg-primary/5 px-2 py-1 rounded-sm border border-primary/10"
                                >
                                    <Paperclip size={10} /> Añadir Clip
                                </button>
                            </div>
                            <div
                                {...dropzone.getRootProps()}
                                className={cn(
                                    "relative transition-all",
                                    dropzone.isDragActive ? "ring-2 ring-primary ring-offset-2 rounded-sm" : ""
                                )}
                            >
                                <input {...dropzone.getInputProps()} />
                                <textarea
                                    value={systemPrompt}
                                    onChange={e => setSystemPrompt(e.target.value)}
                                    rows={8}
                                    placeholder="Instrucciones... Suelta archivos aquí para analizarlos."
                                    className={cn(inputClasses, "resize-none leading-relaxed", dropzone.isDragActive ? "bg-primary/5 border-primary" : "")}
                                />
                                {isAnalyzingFile && (
                                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-sm z-10">
                                        <Loader2 size={24} className="animate-spin text-primary mb-2" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">IA Procesando...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                        <Button onClick={handleSubmit} disabled={createLoading} className="rounded-sm px-6 py-2.5 text-sm font-bold uppercase tracking-wider">
                            {createLoading ? 'Guardando...' : <>Desplegar Agente <PlusCircle className="ml-2 w-4 h-4" /></>}
                        </Button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div key="list-org-agents" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto">
            <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary" />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Agentes de la Organización</h2>
                        <p className="text-sm opacity-40 ml-0 mt-0.5">Asistentes vinculados a {user?.organizationId ? `Org #${user.organizationId}` : 'tu cuenta'}.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                    {isSuperAdmin && (
                        <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2 pl-3">
                            <PlusCircle size={14} /> Crear Nuevo
                        </Button>
                    )}
                </div>
            </header>

            {error && <motion.div className="mb-4 p-3 bg-red-500/10 text-red-500 text-xs font-bold">{error}</motion.div>}
            {success && <motion.div className="mb-4 p-3 bg-green-500/10 text-green-500 text-xs font-bold">{success}</motion.div>}

            <div className={cardClasses}>
                <div className="grid grid-cols-[3fr_1fr_auto] gap-4 px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Nombre / Prompt Base</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Modo</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Acciones</span>
                </div>

                {loading && agents.length === 0 ? (
                    <div className="flex items-center justify-center py-20 opacity-40"><Loader2 className="animate-spin" /></div>
                ) : agents.length === 0 ? (
                    <div className="p-10 text-center opacity-40 font-bold">No hay agentes en tu organización</div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {agents.map(a => (
                            <div key={a.id} className="grid grid-cols-[3fr_1fr_auto] items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                                <div>
                                    <p className="font-bold text-sm">{a.name}</p>
                                    <p className="text-xs opacity-40 line-clamp-1">{a.systemPrompt}</p>
                                </div>
                                <div className="text-xs font-bold opacity-60">
                                    {a.mode || 'CHAT'}
                                </div>
                                {isSuperAdmin && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={async () => {
                                                const details = await oddityClient.customAgent.findOne(a.id);
                                                setName(details.name);
                                                setSystemPrompt(details.systemPrompt);
                                                setMode(details.mode || 'CHAT');
                                                setModelId(details.modelId?.toString() || '');
                                                setExpectedOutput(details.expectedOutput || 'text');
                                                // @ts-ignore
                                                setIsAdding(a.id);
                                            }}
                                            className="p-2 text-primary hover:bg-primary/10 transition-colors rounded-sm cursor-pointer"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-500/10 transition-colors rounded-sm cursor-pointer">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function SuperModelsView({ formVariants, cardClasses, inputClasses, labelClasses }: any) {
    const { createIaModel, loading: createLoading, error, success, setError, setSuccess } = usePanelData();
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [name, setName] = useState('');
    const [priceInput, setPriceInput] = useState('');
    const [priceOutput, setPriceOutput] = useState('');

    const fetchData = () => {
        setLoading(true);
        oddityClient.iaModel.findAll()
            .then(res => setModels(res))
            .catch(() => setError("Error cargando modelos"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async () => {
        if (!name || !priceInput || !priceOutput) return;

        let res: any = null;
        if (typeof isAdding === 'number') {
            res = await oddityClient.iaModel.update(isAdding, {
                name, pricePerInputToken: Number(priceInput), pricePerOutputToken: Number(priceOutput)
            });
            setSuccess("Modelo actualizado");
        } else {
            res = await createIaModel({
                name, pricePerInputToken: Number(priceInput), pricePerOutputToken: Number(priceOutput), isActive: true
            });
        }

        if (res) { setIsAdding(false); fetchData(); setName(''); setPriceInput(''); setPriceOutput(''); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Seguro que deseas eliminar el modelo?")) return;
        try {
            await oddityClient.iaModel.remove(id);
            setModels(prev => prev.filter(m => m.id !== id));
            setSuccess("Modelo eliminado");
        } catch (e: any) { setError(e.message || "Error eliminando"); }
    };

    if (isAdding) {
        return (
            <motion.div key="add-model" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-3xl mx-auto">
                <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-primary" />
                            <h2 className="text-2xl font-bold tracking-tight">{typeof isAdding === 'number' ? 'Editar Modelo IA' : 'Registrar Modelo IA'}</h2>
                        </div>
                    </div>
                    <Button onClick={() => { setIsAdding(false); setName(''); setPriceInput(''); setPriceOutput(''); }} className="bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20">Volver</Button>
                </header>
                {error && <motion.div className="mb-4 p-3 bg-red-500/10 text-red-500 text-xs font-bold">{error}</motion.div>}
                {success && <motion.div className="mb-4 p-3 bg-green-500/10 text-green-500 text-xs font-bold">{success}</motion.div>}
                <div className={cn(cardClasses, "p-6")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2 space-y-2">
                            <label className={labelClasses}>Provider / Nombre del Modelo</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. GPT-4o" className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Precio Input</label>
                            <input type="number" step="0.0001" value={priceInput} onChange={e => setPriceInput(e.target.value)} placeholder="0.005" className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Precio Output</label>
                            <input type="number" step="0.0001" value={priceOutput} onChange={e => setPriceOutput(e.target.value)} placeholder="0.015" className={inputClasses} />
                        </div>
                        <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-white/5">
                            <Button onClick={handleSubmit} disabled={createLoading} className="rounded-sm px-6 py-2.5 text-sm font-bold uppercase flex items-center gap-2">
                                {createLoading ? 'Activando...' : <>Activar Modelo <Cpu className="w-4 h-4" /></>}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div key="list-models" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto">
            <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary" />
                    <div><h2 className="text-2xl font-bold tracking-tight">Modelos IA</h2></div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
                    <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2 pl-3"><PlusCircle size={14} /> Añadir</Button>
                </div>
            </header>
            {error && <motion.div className="mb-4 p-3 bg-red-500/10 text-red-500 text-xs font-bold">{error}</motion.div>}
            {success && <motion.div className="mb-4 p-3 bg-green-500/10 text-green-500 text-xs font-bold">{success}</motion.div>}
            <div className={cn(cardClasses, "overflow-hidden")}>
                <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Modelo</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Acciones</span>
                </div>
                {loading && models.length === 0 ? <div className="py-20 flex justify-center opacity-40"><Loader2 className="animate-spin" /></div> : models.length === 0 ? <div className="p-10 text-center opacity-40 font-bold">No hay modelos</div> : (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {models.map(m => (
                            <div key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                                <div>
                                    <p className="font-bold text-sm">{m.name}</p>
                                    <p className="text-xs opacity-40">IP: ${m.pricePerInputToken} | OP: ${m.pricePerOutputToken}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setName(m.name);
                                            setPriceInput(m.pricePerInputToken.toString());
                                            setPriceOutput(m.pricePerOutputToken.toString());
                                            // @ts-ignore
                                            setIsAdding(m.id);
                                        }}
                                        className="p-2 text-primary hover:bg-primary/10 transition-colors rounded-sm cursor-pointer"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(m.id)} className="p-2 text-red-500 hover:bg-red-500/10 transition-colors rounded-sm cursor-pointer"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function SuperOrgsView({ formVariants, cardClasses, inputClasses, labelClasses }: any) {
    const { createOrganization, loading: createLoading, error, success, setError, setSuccess } = usePanelData();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [billingEmail, setBillingEmail] = useState('');
    const [limit, setLimit] = useState('');
    const [logo, setLogo] = useState('');
    const [token, setToken] = useState('');

    const fetchData = () => {
        setLoading(true);
        oddityClient.organization.findAll()
            .then(res => setOrganizations(res))
            .catch(() => setError("Error cargando organizaciones"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async () => {
        if (!name || !slug || !billingEmail || !limit || !logo || !token) return;

        let res: any = null;
        if (typeof isAdding === 'number') {
            res = await oddityClient.organization.update(isAdding, {
                name, slug, billingEmail, monthlySpendingLimit: Number(limit), logo, accessToken: token
            });
            setSuccess("Organización actualizada");
        } else {
            res = await createOrganization({
                name, slug, billingEmail, monthlySpendingLimit: Number(limit), logo, accessToken: token, isActive: true, currentSpent: 0
            });
        }

        if (res) { setIsAdding(false); fetchData(); setName(''); setSlug(''); setBillingEmail(''); setLimit(''); setLogo(''); setToken(''); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Seguro que deseas eliminar la organización?")) return;
        try {
            await oddityClient.organization.remove(id);
            setOrganizations(prev => prev.filter(o => o.id !== id));
            setSuccess("Organización eliminada");
        } catch (e: any) { setError(e.message || "Error al eliminar"); }
    };

    if (isAdding) {
        return (
            <motion.div key="add-org" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-3xl mx-auto">
                <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3"><div className="w-1 h-6 bg-primary" /><h2 className="text-2xl font-bold tracking-tight">{typeof isAdding === 'number' ? 'Editar Organización' : 'Nueva Organización'}</h2></div>
                        <p className="text-sm opacity-40 ml-4 mt-1">Configura una empresa en el ecosistema Oddity.</p>
                    </div>
                    <Button onClick={() => { setIsAdding(false); setName(''); setSlug(''); setBillingEmail(''); setLimit(''); setToken(''); setLogo(''); }} className="bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20">Volver</Button>
                </header>
                {error && <motion.div className="mb-4 p-3 bg-red-500/10 text-red-500 text-xs font-bold">{error}</motion.div>}
                {success && <motion.div className="mb-4 p-3 bg-green-500/10 text-green-500 text-xs font-bold">{success}</motion.div>}
                <div className={cn(cardClasses, "p-6")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className={labelClasses}>Nombre de Empresa</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Slug</label>
                            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Email Facturación</label>
                            <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Límite Mensual ($)</label>
                            <input type="number" value={limit} onChange={e => setLimit(e.target.value)} className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Access Token</label>
                            <div className="flex gap-2">
                                <input type="text" value={token} onChange={e => setToken(e.target.value)} className={inputClasses} />
                                <Button onClick={() => setToken('odd_' + Array.from({ length: 32 }, () => Math.random().toString(36)[2] || 'x').join(''))} className="shrink-0 px-3" variant="secondary"><RefreshCw size={16} /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>Logo URL</label>
                            <input type="text" value={logo} onChange={e => setLogo(e.target.value)} className={inputClasses} />
                        </div>
                        <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-white/5">
                            <Button onClick={handleSubmit} disabled={createLoading} className="rounded-sm px-6 py-2.5 text-sm font-bold uppercase"><ArrowRight className="w-4 h-4 ml-2" /> Crear Org</Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div key="list-orgs" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto">
            <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-1 h-6 bg-primary" /><h2 className="text-2xl font-bold tracking-tight">Organizaciones</h2></div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
                    <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2 pl-3"><PlusCircle size={14} /> Añadir</Button>
                </div>
            </header>
            {error && <motion.div className="mb-4 p-3 bg-red-500/10 text-red-500 text-xs font-bold">{error}</motion.div>}
            {success && <motion.div className="mb-4 p-3 bg-green-500/10 text-green-500 text-xs font-bold">{success}</motion.div>}
            <div className={cn(cardClasses, "overflow-hidden")}>
                <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Organización</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Acciones</span>
                </div>
                {loading && organizations.length === 0 ? <div className="py-20 flex justify-center opacity-40"><Loader2 className="animate-spin" /></div> : organizations.length === 0 ? <div className="p-10 text-center opacity-40 font-bold">No hay organizaciones</div> : (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {organizations.map(o => (
                            <div key={o.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                                <div><p className="font-bold text-sm">{o.name}</p><p className="text-xs opacity-40">{o.billingEmail}</p></div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setName(o.name);
                                            setSlug(o.slug);
                                            setBillingEmail(o.billingEmail);
                                            setLimit(o.monthlySpendingLimit.toString());
                                            setLogo(o.logo);
                                            setToken(o.accessToken);
                                            // @ts-ignore
                                            setIsAdding(o.id);
                                        }}
                                        className="p-2 text-primary hover:bg-primary/10 transition-colors rounded-sm cursor-pointer"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(o.id)} className="p-2 text-red-500 hover:bg-red-500/10 transition-colors rounded-sm cursor-pointer">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function AgentChatView({ agentId, formVariants, inputClasses, cardClasses, addToast }: any) {
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        oddityClient.customAgent.findOne(Number(agentId))
            .then(res => { setAgent(res); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [agentId]);

    if (loading) return <div className="h-full flex items-center justify-center opacity-40"><Loader2 className="animate-spin" /></div>;
    if (!agent) return <div className="h-full flex items-center justify-center opacity-40 font-bold text-sm">Agente no encontrado</div>;

    if (agent.mode === 'FILE') {
        return <AgentDocumentInterface agent={agent} formVariants={formVariants} inputClasses={inputClasses} cardClasses={cardClasses} addToast={addToast} />;
    }

    return <AgentChatInterface agent={agent} formVariants={formVariants} inputClasses={inputClasses} cardClasses={cardClasses} addToast={addToast} />;
}

interface Message {
    role: string;
    content: string;
    files?: string[];
    isStreamed?: boolean;
    jobId?: string;
}


function AgentChatInterface({ agent, formVariants, inputClasses, cardClasses, addToast }: any) {
    const [messages, setMessages] = useState<Message[]>([]);

    const [input, setInput] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<any>(null);

    const onDrop = (acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if ((!input.trim() && files.length === 0) || sending) return;
        const userMsg = input;
        const currentFiles = [...files];

        setMessages(prev => [...prev, {
            role: 'user',
            content: userMsg,
            files: currentFiles.map(f => f.name)
        }]);

        setInput('');
        setFiles([]);
        setSending(true);

        try {
            const historyDto = messages.map(m => ({
                role: m.role === 'ai' ? 'model' : m.role,
                text: m.content
            }));

            let res;
            if (currentFiles.length > 0) {
                const formData = new FormData();
                currentFiles.forEach(f => formData.append('files', f));
                formData.append('customAgentId', agent.id.toString());
                formData.append('prompt', userMsg);
                formData.append('history', JSON.stringify(historyDto));
                addToast?.('Procesando archivo con IA...', 'progress');
                res = await oddityClient.customAgent.use(formData, (msg: string) => {
                    addToast?.(msg, 'progress');
                });
            } else {
                res = await oddityClient.customAgent.use({
                    customAgentId: agent.id,
                    history: historyDto,
                    prompt: userMsg
                });
            }

            if ((res as any).__redirect) {
                // Large Excel redirect in Chat mode
                addToast?.('Redirigiendo a pipeline de streaming...', 'progress');



                // Re-prepare formData since we need it for useStreamExcel
                const formDataRedirect = new FormData();
                currentFiles.forEach(f => formDataRedirect.append('files', f));
                formDataRedirect.append('customAgentId', agent.id.toString());
                formDataRedirect.append('prompt', userMsg);
                formDataRedirect.append('history', JSON.stringify(historyDto));

                const { jobId } = await oddityClient.customAgent.useStreamExcel(
                    formDataRedirect,
                    (msg: string) => addToast?.(msg, 'progress'),
                );


                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: 'El archivo ha sido procesado mediante streaming y descargado automáticamente.',
                    isStreamed: true,
                    jobId // Store jobId in the message
                }]);
                addToast?.('✓ Archivo procesado', 'success');
                return;

            }

            const aiResponse = res.text || res.message || (typeof res === 'string' ? res : JSON.stringify(res));
            setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);

            // Handle expected output if provided
            if (res.expectedOutput && res.expectedOutput !== 'text') {
                handleAutoDownload(aiResponse, res.expectedOutput, agent.name);
            }


        } catch (e: any) {
            setMessages(prev => [...prev, { role: 'system', content: `Error: ${e.message}` }]);
        } finally {
            setSending(false);
        }
    };

    const handleAutoDownload = async (content: string, type: string, agentName: string) => {
        const filename = `${agentName.replace(/\s+/g, '_')}_${new Date().getTime()}`;
        if (type === 'excel') {
            try {
                const cleanContent = content.replace(/```(?:csv|text)?\n?([\s\S]*?)\n?```/g, '$1').trim();

                // Optimized parsing for large CSV strings
                const rows = cleanContent.split('\n').filter(l => l.trim());
                if (rows.length === 0) return;

                const aoa: any[][] = rows.map(row => row.split(';'));

                const MAX_CHARS = 32000;
                const processedAOA: any[][] = [];

                aoa.forEach(row => {
                    let maxSplits = 1;
                    row.forEach(cell => {
                        if (typeof cell === 'string') {
                            maxSplits = Math.max(maxSplits, Math.ceil(cell.length / MAX_CHARS));
                        }
                    });

                    if (maxSplits <= 1) {
                        processedAOA.push(row);
                    } else {
                        for (let i = 0; i < maxSplits; i++) {
                            const subRow = row.map(cell => {
                                if (typeof cell !== 'string') return i === 0 ? cell : '';
                                return cell.substring(i * MAX_CHARS, (i + 1) * MAX_CHARS);
                            });
                            processedAOA.push(subRow);
                        }
                    }
                });

                const ws = XLSX.utils.aoa_to_sheet(processedAOA);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Result");
                XLSX.writeFile(wb, `${filename}.xlsx`);
            } catch (e) {
                console.error('Failed to parse CSV for Excel auto-download:', e);
                const element = document.createElement("a");
                const file = new Blob([content], { type: 'text/csv' });
                element.href = URL.createObjectURL(file);
                element.download = `${filename}.csv`;
                document.body.appendChild(element);
                element.click();
            }
        } else if (type === 'pdf') {
            try {
                const { pdf } = await import('@react-pdf/renderer');
                const blob = await pdf(<ResultPDF content={content} title={agentName} />).toBlob();
                const element = document.createElement("a");
                element.href = URL.createObjectURL(blob);
                element.download = `${filename}.pdf`;
                document.body.appendChild(element);
                element.click();
            } catch (e) {
                console.error('Failed to generate PDF:', e);
            }
        }
    };

    return (
        <motion.div key={`agent-${agent.id}`} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto h-full flex flex-col">
            <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
                <div className="w-1 h-6 bg-primary" />
                <h2 className="text-2xl font-bold tracking-tight">{agent.name}</h2>
                <span className="ml-auto text-[9px] font-black px-2 py-1 bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">{agent.mode || 'CHAT'}</span>
            </header>

            <div className={cn(cardClasses, "flex-1 flex flex-col overflow-hidden")}>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                            <Bot size={48} />
                            <p className="font-bold text-sm">Comienza una conversación con {agent.name}</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={cn("flex w-full gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                    msg.role === 'user' ? "bg-primary/10 border-primary/20 text-primary" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-secondary dark:text-white"
                                )}>
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className={cn("max-w-[80%] rounded-sm p-4 text-sm leading-relaxed shadow-sm",
                                    msg.role === 'user' ? "bg-primary text-white" :
                                        msg.role === 'ai' ? "bg-white dark:bg-white/5 text-secondary dark:text-white border border-slate-100 dark:border-white/5" :
                                            msg.role === 'system' ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-slate-100 dark:bg-white/5")}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                            {msg.role === 'user' ? 'Tú' : agent.name}
                                        </span>
                                    </div>

                                    {(msg.content.includes('__streamed__') || msg.isStreamed) ? (
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded flex flex-col gap-2">
                                            <p className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <FileSpreadsheet size={14} /> Streaming completado
                                            </p>
                                            <p className="text-[10px] opacity-60">
                                                El archivo ha sido procesado mediante streaming y descargado automáticamente como CSV.
                                            </p>
                                        </div>
                                    ) : msg.content.length > 2000 && (msg.content.includes(';') || msg.content.includes(',')) ? (
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded flex flex-col gap-2">
                                            <p className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <FileSpreadsheet size={14} /> Datos generados ({msg.content.split('\n').length} filas)
                                            </p>
                                            <p className="text-[10px] opacity-60">El contenido es extenso y se ha descargado automáticamente como Excel para tu comodidad.</p>
                                            <button
                                                onClick={() => handleAutoDownload(msg.content, 'excel', agent.name)}
                                                className="text-[10px] uppercase font-black tracking-widest text-primary hover:underline self-start"
                                            >
                                                Volver a descargar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    )}



                                    {msg.files && msg.files.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-current/10 flex flex-wrap gap-2 text-[10px] opacity-70">
                                            {msg.files.map((fn, idx) => (
                                                <span key={idx} className="bg-current/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Upload size={10} /> {fn}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2">
                    {files.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded border border-primary/20">
                                    <span className="max-w-[100px] truncate">{f.name}</span>
                                    <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition-colors">
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                            <span className="text-[10px] opacity-40 self-center ml-1">{files.length} archivo(s) seleccionado(s)</span>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <div {...getRootProps()} className={cn("p-2 border border-slate-200 dark:border-white/10 hover:border-primary/50 transition-colors flex items-center justify-center cursor-pointer rounded-sm bg-white dark:bg-white/5", isDragActive && "border-primary")}>
                            <input {...getInputProps()} />
                            <div className="relative">
                                <Paperclip size={20} className={cn("transition-all", files.length > 0 ? "text-primary opacity-100" : "opacity-40")} />
                                {files.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary text-[8px] flex items-center justify-center text-white rounded-full font-black">
                                        {files.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={sending}
                            placeholder="Escribe un mensaje o suelta archivos aquí..."
                            className={cn(inputClasses, "flex-1 border-transparent focus:border-transparent cursor-text text-black dark:text-white")}
                        />
                        <button onClick={handleSend} disabled={sending || (!input.trim() && files.length === 0)} className="px-6 py-2 bg-primary text-white font-bold rounded-sm uppercase tracking-wider text-xs flex items-center gap-2 hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50">
                            {sending ? <Loader2 size={14} className="animate-spin" /> : 'Enviar'} <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

const pdfStyles = StyleSheet.create({
    page: { padding: 50, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
    section: { marginBottom: 15 },
    title: { fontSize: 28, marginBottom: 25, fontWeight: 'bold', color: '#000', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    h1: { fontSize: 20, marginBottom: 12, marginTop: 15, fontWeight: 'bold', color: '#111' },
    h2: { fontSize: 16, marginBottom: 10, marginTop: 12, fontWeight: 'bold', color: '#222' },
    h3: { fontSize: 14, marginBottom: 8, marginTop: 10, fontWeight: 'bold', color: '#333' },
    paragraph: { fontSize: 11, lineHeight: 1.6, color: '#444', marginBottom: 10 },
    bold: { fontWeight: 'bold', color: '#000' },
    italic: { fontStyle: 'italic' },
    listItem: { marginLeft: 15, marginBottom: 5, flexDirection: 'row' },
    bullet: { width: 10, fontSize: 11 },
    listText: { flex: 1, fontSize: 11, lineHeight: 1.6, color: '#444' },
    codeBlock: { backgroundColor: '#f5f5f5', padding: 10, borderRadius: 3, marginVertical: 10, fontFamily: 'Courier' },
    codeText: { fontSize: 10, color: '#d63384' }
});

const ResultPDF = ({ content, title }: any) => {
    const parseMarkdown = (text: string) => {
        const lines = text.split('\n');
        const elements: any[] = [];
        let currentList: any[] = [];

        const flushList = () => {
            if (currentList.length > 0) {
                elements.push(
                    <View key={`list-${elements.length}`} style={{ marginBottom: 10 }}>
                        {currentList}
                    </View>
                );
                currentList = [];
            }
        };

        const parseInline = (line: string, keyPrefix: string) => {
            const parts: any[] = [];
            let lastIndex = 0;

            // Bold (**text**) and Italic (*text*)
            const combinedRegex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
            let match;

            while ((match = combinedRegex.exec(line)) !== null) {
                // Add text before match
                if (match.index > lastIndex) {
                    parts.push(line.substring(lastIndex, match.index));
                }

                if (match[1]) { // Bold
                    parts.push(<Text key={`${keyPrefix}-b-${match.index}`} style={pdfStyles.bold}>{match[2]}</Text>);
                } else if (match[3]) { // Italic
                    parts.push(<Text key={`${keyPrefix}-i-${match.index}`} style={pdfStyles.italic}>{match[4]}</Text>);
                }

                lastIndex = combinedRegex.lastIndex;
            }

            if (lastIndex < line.length) {
                parts.push(line.substring(lastIndex));
            }

            return parts.length > 0 ? parts : line;
        };

        let inCodeBlock = false;
        let codeContent = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Code Blocks
            if (line.startsWith('```')) {
                if (inCodeBlock) {
                    elements.push(
                        <View key={`code-${i}`} style={pdfStyles.codeBlock}>
                            <Text style={pdfStyles.codeText}>{codeContent.trim()}</Text>
                        </View>
                    );
                    codeContent = '';
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                }
                continue;
            }

            if (inCodeBlock) {
                codeContent += lines[i] + '\n';
                continue;
            }

            // Headers
            if (line.startsWith('# ')) {
                flushList();
                elements.push(<Text key={i} style={pdfStyles.h1}>{line.substring(2)}</Text>);
            } else if (line.startsWith('## ')) {
                flushList();
                elements.push(<Text key={i} style={pdfStyles.h2}>{line.substring(3)}</Text>);
            } else if (line.startsWith('### ')) {
                flushList();
                elements.push(<Text key={i} style={pdfStyles.h3}>{line.substring(4)}</Text>);
            }
            // Lists
            else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
                const bullet = line.startsWith('- ') || line.startsWith('* ') ? '•' : line.split('.')[0] + '.';
                const contentText = line.replace(/^[-*] |\d+\.\s/, '');
                currentList.push(
                    <View key={`li-${i}`} style={pdfStyles.listItem}>
                        <Text style={pdfStyles.bullet}>{bullet}</Text>
                        <Text style={pdfStyles.listText}>{parseInline(contentText, `li-inner-${i}`)}</Text>
                    </View>
                );
            }
            // Paragraphs or empty lines
            else if (line === '') {
                flushList();
            } else {
                flushList();
                elements.push(<Text key={i} style={pdfStyles.paragraph}>{parseInline(line, `p-${i}`)}</Text>);
            }
        }
        flushList();
        return elements;
    };

    return (
        <Document>
            <Page size="A4" style={pdfStyles.page}>
                <View style={pdfStyles.section}>
                    <Text style={pdfStyles.title}>{title}</Text>
                    {parseMarkdown(content)}
                </View>
            </Page>
        </Document>
    );
};

function AgentDocumentInterface({ agent, formVariants, inputClasses, cardClasses, addToast }: any) {
    const [files, setFiles] = useState<File[]>([]);
    const [prompt, setPrompt] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ text: string, type: string, jobId?: string } | null>(null);


    const onDrop = (acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true
    });

    const handleSend = async () => {
        if (files.length === 0 || sending) return;
        setSending(true);
        setResult(null);

        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        formData.append('customAgentId', agent.id.toString());
        if (prompt) formData.append('prompt', prompt);
        formData.append('history', JSON.stringify([]));

        const isExcelAgent = agent.expectedOutput === 'excel';
        const hasExcelFile = files.some(f =>
            f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
        );

        try {
            // ── Large Excel pipeline: POST /use/stream-csv ──────────────────
            // Route directly when the agent produces Excel output AND an Excel
            // file is attached. The server streams CSV; we collect → download.
            if (isExcelAgent && hasExcelFile) {
                addToast?.('Iniciando pipeline de streaming para Excel grande...', 'progress');

                const { jobId } = await oddityClient.customAgent.useStreamExcel(
                    formData,
                    (msg: string) => addToast?.(msg, 'progress'),
                );


                // Mark result as successfully streamed (no in-memory content)
                setResult({ text: '__streamed__', type: 'excel', jobId });
                addToast?.('✓ Procesamiento completado', 'success');
                return;
            }


            // ── Normal SSE path (chat, image, video, small files) ────────────
            addToast?.('Procesando documento con IA...', 'progress');
            const res = await oddityClient.customAgent.use(formData, (msg: string) => {
                addToast?.(msg, 'progress');
            });

            // Backend may redirect large Excel to the streaming endpoint
            if ((res as any).__redirect) {
                addToast?.('Redirigiendo a pipeline de streaming...', 'progress');
                const { jobId } = await oddityClient.customAgent.useStreamExcel(
                    formData,
                    (msg: string) => addToast?.(msg, 'progress'),
                );

                setResult({ text: '__streamed__', type: 'excel', jobId });
                addToast?.('✓ Procesamiento completado', 'success');
                return;

            }

            const aiResponse = res.text || res.message || (typeof res === 'string' ? res : JSON.stringify(res));
            const outputType = res.expectedOutput || agent.expectedOutput || 'text';

            setResult({ text: aiResponse, type: outputType });
            addToast?.('✓ Procesamiento completado', 'success');

            if (outputType === 'excel') {
                setTimeout(() => downloadExcel(aiResponse), 100);
            }
        } catch (e: any) {
            setResult({ text: `Error: ${e.message}`, type: 'text' });
            addToast?.(`Error: ${e.message}`, 'error');
        } finally {
            setSending(false);
        }
    };


    const downloadTxt = () => {
        const element = document.createElement("a");
        const file = new Blob([result?.text || ''], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${agent.name}_result.txt`;
        document.body.appendChild(element);
        element.click();
    };

    const downloadExcel = (contentOverride?: string) => {
        const content = contentOverride || result?.text || '';
        const filename = `${agent.name.replace(/\s+/g, '_')}_result`;
        try {
            const cleanContent = content.replace(/```(?:csv|text)?\n?([\s\S]*?)\n?```/g, '$1').trim();

            const rows = cleanContent.split('\n').filter(l => l.trim());
            const aoa: any[][] = rows.map(row => row.split(';'));

            const MAX_CHARS = 32000;
            const processedAOA: any[][] = [];

            aoa.forEach(row => {
                let maxSplits = 1;
                row.forEach(cell => {
                    if (typeof cell === 'string') {
                        maxSplits = Math.max(maxSplits, Math.ceil(cell.length / MAX_CHARS));
                    }
                });

                if (maxSplits <= 1) {
                    processedAOA.push(row);
                } else {
                    for (let i = 0; i < maxSplits; i++) {
                        const subRow = row.map(cell => {
                            if (typeof cell !== 'string') return i === 0 ? cell : '';
                            return cell.substring(i * MAX_CHARS, (i + 1) * MAX_CHARS);
                        });
                        processedAOA.push(subRow);
                    }
                }
            });

            const ws = XLSX.utils.aoa_to_sheet(processedAOA);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Result");
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } catch (e) {
            console.error('Failed to parse CSV for Excel download:', e);
            const element = document.createElement("a");
            const file = new Blob([content], { type: 'text/csv' });
            element.href = URL.createObjectURL(file);
            element.download = `${filename}.csv`;
            document.body.appendChild(element);
            element.click();
            alert("Error al generar el Excel. Se descargó como CSV.");
        }
    };

    return (
        <motion.div key={`agent-${agent.id}`} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto h-full flex flex-col">
            <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
                <div className="w-1 h-6 bg-red-500" />
                <h2 className="text-2xl font-bold tracking-tight">{agent.name}</h2>
                <span className="ml-auto text-[9px] font-black px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-widest">FILE MODE</span>
            </header>

            <div className={cn(cardClasses, "flex-1 flex flex-col p-8 overflow-y-auto")}>
                {result ? (
                    <div className="w-full flex-1 flex flex-col items-start text-left space-y-4">
                        <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100 dark:border-white/5">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Bot className="text-primary" /> Resultado del Análisis</h3>
                            <div className="flex gap-2">
                                {result.type === 'pdf' && result.text !== '__streamed__' && (
                                    <PDFDownloadLink document={<ResultPDF content={result.text} title={agent.name} />} fileName={`${agent.name}_result.pdf`}>
                                        {({ loading }) => (
                                            <Button variant="outline" size="sm" className="bg-red-500/5 text-red-500 border-red-500/20">
                                                {loading ? 'Preparando...' : 'Descargar PDF'}
                                            </Button>
                                        )}
                                    </PDFDownloadLink>
                                )}
                                {result.type === 'excel' && !result.text.includes('__streamed__') && (
                                    <Button onClick={() => downloadExcel()} variant="outline" size="sm" className="bg-green-500/5 text-green-600 border-green-500/20">
                                        Descargar Excel
                                    </Button>
                                )}
                                {!result.text.includes('__streamed__') && <Button onClick={downloadTxt} variant="outline" size="sm">Descargar TXT</Button>}


                                <Button onClick={() => { setResult(null); setFiles([]); setPrompt(''); }} className="bg-primary text-white">Nuevo Análisis</Button>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-[#080808] border border-slate-200 dark:border-white/5 text-sm w-full whitespace-pre-wrap leading-relaxed shadow-sm rounded-sm font-medium opacity-90 overflow-x-auto">
                            {result.type === 'excel' || result.text.includes('__streamed__') ? (
                                <div className="flex flex-col items-center py-10 gap-4">
                                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                                        <FileSpreadsheet size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-base">Excel Generado Correctamente</p>
                                        {result.text.includes('__streamed__') ? (
                                            <p className="text-xs opacity-50 mt-1">
                                                El archivo fue procesado mediante streaming y descargado directamente.
                                            </p>
                                        ) : (
                                            <p className="text-xs opacity-50 mt-1">
                                                El archivo se ha descargado automáticamente. Contiene {result.text.split('\n').length} filas procesadas.
                                            </p>
                                        )}
                                    </div>
                                    {result.text.includes('__streamed__') ? (
                                        <Button
                                            onClick={() => {
                                                if (result.jobId) {
                                                    window.open(oddityClient.customAgent.getResultUrl(result.jobId), '_blank');
                                                } else {
                                                    const formData = new FormData();
                                                    files.forEach(f => formData.append('files', f));
                                                    formData.append('customAgentId', agent.id.toString());
                                                    if (prompt) formData.append('prompt', prompt);
                                                    formData.append('history', JSON.stringify([]));


                                                    addToast?.('Iniciando re-procesamiento...', 'progress');
                                                    oddityClient.customAgent.useStreamExcel(formData, (msg: string) => addToast?.(msg, 'progress'))
                                                        .catch((e: any) => addToast?.(`Error: ${e.message}`, 'error'));
                                                }

                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                        >
                                            <Upload size={14} className="rotate-180" /> Descargar de Nuevo
                                        </Button>
                                    ) : (
                                        <Button onClick={() => downloadExcel()} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                            <Upload size={14} className="rotate-180" /> Descargar de Nuevo
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                result.text
                            )}

                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col">
                        <div
                            {...getRootProps()}
                            className={cn("flex-1 min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer rounded-sm p-8",
                                isDragActive ? "border-primary bg-primary/5 shadow-inner" : "border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/2 hover:border-slate-400 dark:hover:border-white/20")}
                        >
                            <input {...getInputProps()} />
                            <div className="w-20 h-20 bg-red-500/10 flex items-center justify-center mb-6 text-red-500 rounded-full shadow-sm">
                                <FileSpreadsheet size={40} />
                            </div>

                            <h3 className="text-2xl font-black mb-2">Cargar Documentos</h3>
                            <p className="opacity-40 text-sm max-w-sm mb-6">
                                Arrastra tus archivos o haz clic para seleccionarlos. Admite múltiples archivos (PDF, CSV, XLSX, TXT).
                            </p>

                            {files.length > 0 && (
                                <div className="w-full max-w-md space-y-2 mb-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-left w-full pl-1">Archivos seleccionados ({files.length})</p>
                                    <div className="max-h-32 overflow-y-auto custom-scrollbar border border-slate-100 dark:border-white/5 rounded p-2 bg-white/5">
                                        {files.map((file, i) => (
                                            <div key={i} className="flex items-center gap-3 text-xs font-bold py-1.5 px-3 border-b last:border-0 border-slate-100 dark:border-white/5">
                                                <Upload size={14} className="opacity-30" />
                                                <span className="truncate flex-1 text-left">{file.name}</span>
                                                <span className="opacity-30 text-[9px]">{(file.size / 1024).toFixed(0)} KB</span>
                                                <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="text-red-500 p-1 hover:bg-red-500/10 rounded">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-full mt-8 flex flex-col gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 block pl-1">Instrucciones de Análisis</label>
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    rows={3}
                                    placeholder="Instrucciones adicionales para analizar los archivos..."
                                    className={cn(inputClasses, "resize-none leading-relaxed")}
                                />
                            </div>

                            <Button onClick={handleSend} disabled={files.length === 0 || sending} className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                                {sending ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
                                {sending ? 'Procesando archivos...' : 'Ejecutar Análisis Completo'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ================================================================
// Org Info View
// ================================================================
function OrgInfoView({ formVariants, cardClasses }: any) {
    const { user: rawUser } = useApp();
    const user = rawUser as UserData | null;
    const [org, setOrg] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.organizationId) return;
        setLoading(true);
        Promise.all([
            oddityClient.organization.findOne(user.organizationId),
            oddityClient.organization.findUsers(user.organizationId),
        ]).then(([o, u]) => { setOrg(o); setUsers(u); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.organizationId]);

    if (loading) return <div className="h-full flex items-center justify-center opacity-40"><Loader2 className="animate-spin" /></div>;
    if (!org) return <div className="h-full flex items-center justify-center opacity-40 font-bold">Sin organización asignada</div>;

    const spent = parseFloat(org.currentSpent || '0');
    const limit = parseFloat(org.monthlySpendingLimit || '1');
    const pct = Math.min((spent / limit) * 100, 100).toFixed(1);

    return (
        <motion.div key="org-info" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto space-y-6">
            <header className="pb-5 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Sobre la Compañía</h2>
                </div>
            </header>

            {/* Org Details */}
            <div className={cn(cardClasses, 'p-6 space-y-4')}>
                <div className="flex items-center gap-5">
                    {org.logo && <img src={org.logo} alt="logo" className="w-16 h-16 object-contain rounded border border-slate-100 dark:border-white/10 p-1" onError={e => (e.currentTarget.style.display = 'none')} />}
                    <div>
                        <h3 className="text-xl font-black">{org.name}</h3>
                        <p className="text-xs opacity-40 font-medium">{org.slug}</p>
                    </div>
                    <span className={cn('ml-auto text-[9px] font-black px-2 py-1 uppercase tracking-widest border', org.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                        {org.isActive ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Email Facturación</p>
                        <p className="text-sm font-medium">{org.billingEmail}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Límite Mensual</p>
                        <p className="text-sm font-medium">${parseFloat(org.monthlySpendingLimit || 0).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Gasto Actual</p>
                        <p className="text-sm font-medium">${spent.toFixed(6)}</p>
                    </div>
                </div>
                {/* Spend bar */}
                <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs opacity-50 font-bold">
                        <span>Gasto del período</span>
                        <span>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                </div>
            </div>

            {/* Users list */}
            <div className={cardClasses}>
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
                    <h4 className="font-black text-sm">Usuarios de la Organización <span className="opacity-40 font-medium">({users.length})</span></h4>
                </div>
                {users.length === 0 ? (
                    <div className="p-8 text-center opacity-40 font-bold text-sm">Sin usuarios registrados.</div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {users.map(u => (
                            <div key={u.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black shrink-0">
                                    {(u.name || u.email || '?')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{u.name}</p>
                                    <p className="text-xs opacity-40 truncate">{u.email}</p>
                                </div>
                                <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded uppercase tracking-wider">{u.role || 'usuario'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ================================================================
// Org Usage View
// ================================================================
function OrgUsageView({ formVariants, cardClasses }: any) {
    const { user: rawUser } = useApp();
    const user = rawUser as UserData | null;
    const [period, setPeriod] = useState<'today' | '30d' | '90d'>('30d');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchStats = (p: 'today' | '30d' | '90d') => {
        if (!user?.organizationId) return;
        setLoading(true);
        oddityClient.organization.getUsageStats(user.organizationId, p)
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchStats(period); }, [user?.organizationId, period]);

    const PERIOD_LABELS: Record<string, string> = { today: 'Hoy', '30d': 'Últimos 30 días', '90d': 'Últimos 90 días' };

    return (
        <motion.div key="org-usage" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto space-y-6">
            <header className="pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Consumo & Costos</h2>
                </div>
                <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-sm">
                    {(['today', '30d', '90d'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                            className={cn('px-3 py-1.5 text-xs font-bold rounded-sm transition-all cursor-pointer',
                                period === p ? 'bg-primary text-white shadow-sm' : 'opacity-50 hover:opacity-100')}>
                            {PERIOD_LABELS[p]}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="h-40 flex items-center justify-center opacity-40"><Loader2 className="animate-spin" /></div>
            ) : stats ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Llamadas', value: stats.callCount, unit: '' },
                            { label: 'Tokens Entrada', value: stats.totalInputTokens?.toLocaleString(), unit: '' },
                            { label: 'Tokens Salida', value: stats.totalOutputTokens?.toLocaleString(), unit: '' },
                            { label: 'Costo Total', value: `$${parseFloat(stats.totalCost || 0).toFixed(6)}`, unit: '' },
                        ].map(card => (
                            <div key={card.label} className={cn(cardClasses, 'p-5 space-y-1')}>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{card.label}</p>
                                <p className="text-2xl font-black">{card.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Usage rows */}
                    <div className={cardClasses}>
                        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2 text-[9px] font-black uppercase tracking-[0.2em] opacity-40">
                            <span>#</span><span>Agente</span><span>Tokens In</span><span>Tokens Out</span><span>Costo $</span>
                        </div>
                        {stats.rows.length === 0 ? (
                            <div className="p-10 text-center opacity-40 font-bold">Sin registros para este período.</div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-80 overflow-y-auto custom-scrollbar">
                                {stats.rows.map((row: any, i: number) => (
                                    <div key={row.id || i} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/2 text-sm">
                                        <span className="text-xs opacity-30 font-bold w-5">{i + 1}</span>
                                        <span className="font-bold truncate">Agent #{row.agentId}</span>
                                        <span className="font-medium opacity-70">{row.inputTokens}</span>
                                        <span className="font-medium opacity-70">{row.outputTokens}</span>
                                        <span className="font-medium text-primary">${parseFloat(row.total || 0).toFixed(6)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </motion.div>
    );
}
