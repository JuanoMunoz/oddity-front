import React, { useState, useRef, useEffect } from 'react';
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
    Bot
} from 'lucide-react';
import { oddityClient } from '../lib/oddityClient';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import type { ViewId } from '../components/Sidebar';
import Button from '../components/Button';
import { cn } from '../styles/utils';
import { useAdminUsers, type UserRole, ASSIGNABLE_ROLES, ROLE_LABELS, useUpdateUser } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { usePanelData } from '../hooks/usePanelData';

export const Panel: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeView, setActiveView] = useState<ViewId>('user-data');
    const formVariants: any = {
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
    };

    const inputClasses = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm py-3 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400 font-medium text-secondary dark:text-white text-sm";
    const labelClasses = "text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 block";
    const cardClasses = "bg-white dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-sm shadow-sm";

    const renderContent = () => {
        if (typeof activeView === 'string' && activeView.startsWith('agent-')) {
            const agentId = activeView.split('-')[1];
            return <AgentChatView key={activeView} agentId={agentId} formVariants={formVariants} inputClasses={inputClasses} cardClasses={cardClasses} />;
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
        <div className="flex h-[calc(100vh-3.5rem)] bg-transparent overflow-hidden">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} activeView={activeView} setActiveView={setActiveView} />

            <main className="flex-1 overflow-y-auto p-8 surface-panel transition-all duration-300 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </main>
        </div>
    );
};

function UserDataView({ formVariants, cardClasses, inputClasses, labelClasses }: { formVariants: any; cardClasses: string; inputClasses: string; labelClasses: string }) {
    const { user } = useApp();
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
    const [isAdding, setIsAdding] = useState(false);

    const [name, setName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [organizationId, setOrganizationId] = useState('');
    const [mode, setMode] = useState<"CHAT" | "FILE" | "IMAGE" | "VIDEO">('CHAT');
    const [modelId, setModelId] = useState('');

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
        const res = await createCustomAgent({
            name, systemPrompt, organizationId: Number(organizationId), mode, modelId: Number(modelId), isActive: true
        });
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
                            <h2 className="text-2xl font-bold tracking-tight">Crear Agente Custom</h2>
                        </div>
                        <p className="text-sm opacity-40 ml-4 mt-1">Define un nuevo comportamiento de IA especializado.</p>
                    </div>
                    <Button onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20">
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
                        <div className="md:col-span-2 space-y-2">
                            <label className={labelClasses}>System Prompt</label>
                            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5} placeholder="Eres un asistente experto en..." className={cn(inputClasses, "resize-none leading-relaxed")} />
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
                                <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-500/10 transition-colors rounded-sm cursor-pointer">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function OrgAgentsView({ formVariants, cardClasses, inputClasses, labelClasses }: any) {
    const { user } = useApp();
    const { createCustomAgent, loading: createLoading, error, success, setError, setSuccess } = usePanelData();
    const [agents, setAgents] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [name, setName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [mode, setMode] = useState<"CHAT" | "FILE" | "IMAGE" | "VIDEO">('CHAT');
    const [modelId, setModelId] = useState('');

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
        const res = await createCustomAgent({
            name, systemPrompt, organizationId: Number(user.organizationId), mode, modelId: Number(modelId), isActive: true
        });
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
        } catch (e: any) { setError(e.message || "Error al eliminar"); }
    };

    if (isAdding) {
        return (
            <motion.div key="add-org-agent" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-3xl mx-auto">
                <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-primary" />
                            <h2 className="text-2xl font-bold tracking-tight">Crear Agente</h2>
                        </div>
                        <p className="text-sm opacity-40 ml-4 mt-1">Define un nuevo comportamiento de IA para la organización.</p>
                    </div>
                    <Button onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20">
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
                        <div className="md:col-span-2 space-y-2">
                            <label className={labelClasses}>System Prompt</label>
                            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5} placeholder="Instrucciones del agente..." className={cn(inputClasses, "resize-none leading-relaxed")} />
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
                    <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2 pl-3">
                        <PlusCircle size={14} /> Crear Nuevo
                    </Button>
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
                                <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-500/10 transition-colors rounded-sm cursor-pointer">
                                    <Trash2 size={16} />
                                </button>
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
        const res = await createIaModel({
            name, pricePerInputToken: Number(priceInput), pricePerOutputToken: Number(priceOutput), isActive: true
        });
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
                            <h2 className="text-2xl font-bold tracking-tight">Registrar Modelo IA</h2>
                        </div>
                    </div>
                    <Button onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20">Volver</Button>
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
                                <button onClick={() => handleDelete(m.id)} className="p-2 text-red-500 hover:bg-red-500/10 transition-colors rounded-sm cursor-pointer"><Trash2 size={16} /></button>
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
        const res = await createOrganization({
            name, slug, billingEmail, monthlySpendingLimit: Number(limit), logo, accessToken: token, isActive: true, currentSpent: 0
        });
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
                        <div className="flex items-center gap-3"><div className="w-1 h-6 bg-primary" /><h2 className="text-2xl font-bold tracking-tight">Nueva Organización</h2></div>
                        <p className="text-sm opacity-40 ml-4 mt-1">Configura una nueva empresa en el ecosistema Oddity.</p>
                    </div>
                    <Button onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20">Volver</Button>
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
                                <button onClick={() => handleDelete(o.id)} className="p-2 text-red-500 hover:bg-red-500/10 transition-colors rounded-sm cursor-pointer"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function AgentChatView({ agentId, formVariants, inputClasses, cardClasses }: any) {
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        oddityClient.customAgent.findAll()
            .then(res => {
                const found = res.find((a: any) => a.id === Number(agentId));
                setAgent(found);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [agentId]);

    if (loading) return <div className="h-full flex items-center justify-center opacity-40"><Loader2 className="animate-spin" /></div>;
    if (!agent) return <div className="h-full flex items-center justify-center opacity-40 font-bold text-sm">Agente no encontrado</div>;

    if (agent.mode === 'FILE') {
        return <AgentDocumentInterface agent={agent} formVariants={formVariants} inputClasses={inputClasses} cardClasses={cardClasses} />;
    }

    return <AgentChatInterface agent={agent} formVariants={formVariants} inputClasses={inputClasses} cardClasses={cardClasses} />;
}

function AgentChatInterface({ agent, formVariants, inputClasses, cardClasses }: any) {
    const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        const userMsg = input;

        const newHistory = [...messages, { role: 'user', content: userMsg }];
        setMessages(newHistory);
        setInput('');
        setSending(true);

        try {
            const historyDto = messages.map(m => ({ role: m.role, text: m.content }));

            const res = await oddityClient.customAgent.use({
                customAgentId: agent.id,
                history: historyDto,
                prompt: userMsg
            });

            const aiResponse = res.text || res.message || (typeof res === 'string' ? res : JSON.stringify(res));
            setMessages(prev => [...prev, { role: 'user', content: aiResponse }]);
        } catch (e: any) {
            setMessages(prev => [...prev, { role: 'model', content: `Error: ${e.message}` }]);
        } finally {
            setSending(false);
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
                            <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                <div className={cn("max-w-[80%] rounded-sm p-4 text-sm leading-relaxed",
                                    msg.role === 'user' ? "bg-primary text-white" :
                                        msg.role === 'model' || msg.role === 'ai' ? "bg-primary/10 text-primary border border-primary/20" :
                                            msg.role === 'system' ? "bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-white/5")}>
                                    {(msg.role === 'model' || msg.role === 'ai') && <div className="font-bold text-xs opacity-50 mb-1">{agent.name}</div>}
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={sending}
                            placeholder="Escribe un mensaje..."
                            className={cn(inputClasses, "flex-1 border-transparent focus:border-transparent")}
                        />
                        <button onClick={handleSend} disabled={sending || !input.trim()} className="px-6 py-2 bg-primary text-white font-bold rounded-sm uppercase tracking-wider text-xs flex items-center gap-2 hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50">
                            {sending ? <Loader2 size={14} className="animate-spin" /> : 'Enviar'} <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function AgentDocumentInterface({ agent, formVariants, inputClasses, cardClasses }: any) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) setSelectedFile(file);
    };

    const triggerFileUpload = () => fileInputRef.current?.click();

    const handleSend = async () => {
        if (!selectedFile || sending) return;
        setSending(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('customAgentId', agent.id.toString());
        if (prompt) formData.append('prompt', prompt);

        // Dummy history as json string
        formData.append('history', JSON.stringify([]));

        try {
            const res = await oddityClient.customAgent.use(formData);
            const aiResponse = res.text || res.message || (typeof res === 'string' ? res : JSON.stringify(res));
            setResult(aiResponse);
        } catch (e: any) {
            setResult(`Error: ${e.message}`);
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div key={`agent-${agent.id}`} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="max-w-4xl mx-auto h-full flex flex-col">
            <header className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
                <div className="w-1 h-6 bg-red-500" />
                <h2 className="text-2xl font-bold tracking-tight">{agent.name}</h2>
                <span className="ml-auto text-[9px] font-black px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-widest">FILE MODE</span>
            </header>

            <div className={cn(cardClasses, "flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto w-full max-w-4xl mx-auto")}>
                {result ? (
                    <div className="w-full flex-1 flex flex-col items-start text-left space-y-4">
                        <div className="flex justify-between items-center w-full">
                            <h3 className="font-bold text-lg">Resultado del Análisis</h3>
                            <Button onClick={() => { setResult(null); setSelectedFile(null); setPrompt(''); }} variant="outline" size="sm">Cargar otro archivo</Button>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-[#0E0E0E] border border-slate-200 dark:border-white/10 text-sm w-full whitespace-pre-wrap leading-relaxed shadow-sm rounded-sm">
                            <div className="font-bold text-primary mb-2 flex items-center gap-2">
                                <Bot size={16} /> Respuesta de IA
                            </div>
                            {result}
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            onDragOver={e => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={triggerFileUpload}
                            className="w-full max-w-xl mx-auto flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-slate-50 dark:bg-white/2 p-12 text-center transition-all cursor-pointer rounded-sm"
                        >
                            <div className="w-16 h-16 bg-red-500/10 flex items-center justify-center mb-6 text-red-500 rounded-full">
                                <FileSpreadsheet size={32} />
                            </div>

                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                            <h3 className="text-xl font-bold mb-2">Cargar Documento</h3>
                            <p className="opacity-40 text-sm max-w-sm">
                                Arrastra tu archivo o haz clic para seleccionarlo.
                            </p>
                        </div>

                        {selectedFile && (
                            <div className="mt-6 flex items-center gap-3 bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2.5 border border-green-500/20 text-sm font-bold w-full max-w-xl rounded-sm">
                                <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full" />
                                <span className="truncate flex-1 text-left">{selectedFile.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="opacity-60 hover:opacity-100 cursor-pointer p-1">
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div className="w-full max-w-xl mt-6 space-y-4">
                            <input
                                type="text"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="Instrucciones adicionales para analizar el archivo (opcional)..."
                                className={inputClasses}
                            />

                            <Button onClick={handleSend} disabled={!selectedFile || sending} className="w-full py-3 bg-primary text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                                {sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                {sending ? 'Analizando...' : 'Subir y Analizar'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}

// ================================================================
// Org Info View
// ================================================================
function OrgInfoView({ formVariants, cardClasses }: any) {
    const { user } = useApp();
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
    const { user } = useApp();
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
