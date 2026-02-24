import React from 'react';
import {
    Building2,
    Bot,
    Key,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    Users,
    LogOut,
    Cpu,
    Globe,
    UserCircle,
    Settings2,
    BarChart2
} from 'lucide-react';
import { cn } from '../styles/utils';
import { useApp } from '../hooks/useApp';

export type ViewId = string;

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    activeView: ViewId;
    setActiveView: (view: ViewId) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, activeView, setActiveView }) => {
    const { user, isAdmin, isSuperAdmin } = useApp();
    const [agents, setAgents] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchAgents = () => {
            if (user?.organizationId) {
                import('../lib/oddityClient').then(({ oddityClient }) => {
                    oddityClient.customAgent.findAll()
                        .then(res => setAgents(res.filter((a: any) => a.organizationId === user.organizationId)))
                        .catch(err => console.error("Error fetching agents", err));
                });
            }
        };
        fetchAgents();
        window.addEventListener('oddity:agent-updated', fetchAgents);
        return () => window.removeEventListener('oddity:agent-updated', fetchAgents);
    }, [user?.organizationId]);

    const sections = [
        {
            section: 'SUPERADMINISTRADOR',
            show: isSuperAdmin,
            items: [
                { id: 'super-users', label: 'Gestionar Usuarios', icon: Users },
                { id: 'super-orgs', label: 'Organizaciones', icon: Globe },
                { id: 'super-agents', label: 'Agentes Custom', icon: Bot },
                { id: 'super-models', label: 'Modelos IA', icon: Cpu },
            ]
        },
        {
            section: 'ADMINISTRADOR',
            show: isAdmin || isSuperAdmin,
            items: [
                { id: 'org-info', label: 'Sobre la compañía', icon: Building2 },
                { id: 'org-agents', label: 'Agentes organización', icon: Users },
                { id: 'org-usage', label: 'Consumo & Costos', icon: BarChart2 },
                { id: 'access-code', label: 'Código de acceso', icon: Key },
            ]
        },
        {
            section: 'USUARIO',
            show: true,
            items: [
                { id: 'user-data', label: 'Mis datos', icon: UserCircle },
                { id: 'settings', label: 'Preferencias', icon: Settings2 },
            ]
        },
        {
            section: 'TUS AGENTES',
            show: agents.length > 0,
            items: agents.map(agent => ({
                id: `agent-${agent.id}`,
                label: agent.name,
                icon: agent.mode === 'FILE' ? FileSpreadsheet : Bot
            }))
        }
    ].filter(section => section.show);

    return (
        <aside className={cn(
            "h-full transition-all duration-300 flex flex-col border-r relative z-20",
            "bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-white/5",
            isCollapsed ? "w-16" : "w-64"
        )}>
            {/* Header / Toggle */}
            <div className="px-4 flex items-center justify-between h-14 border-b border-slate-100 dark:border-white/5">
                {!isCollapsed && (
                    <span className="text-[9px] font-black opacity-20 tracking-[0.3em] uppercase animate-in fade-in duration-500">
                        Módulos
                    </span>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        "p-1.5 rounded-sm transition-all cursor-pointer flex items-center justify-center",
                        "hover:bg-slate-100 dark:hover:bg-white/5 text-secondary dark:text-white/60 hover:text-primary dark:hover:text-primary",
                        isCollapsed ? "mx-auto" : "ml-auto"
                    )}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar pb-8">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-0.5">
                        {!isCollapsed ? (
                            <h4 className="px-3 text-[9px] font-black opacity-20 tracking-[0.2em] mb-2 uppercase">
                                {section.section}
                            </h4>
                        ) : (
                            <div className="h-px w-6 bg-slate-200 dark:bg-white/5 mx-auto mb-4" />
                        )}
                        <div className="space-y-0.5">
                            {section.items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id as ViewId)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all group cursor-pointer relative",
                                        activeView === item.id
                                            ? "bg-primary/10 text-primary border-l-2 border-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] font-bold"
                                            : "opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 border-l-2 border-transparent font-medium"
                                    )}
                                >
                                    <item.icon
                                        size={16}
                                        className={cn(
                                            "shrink-0",
                                            activeView === item.id ? "text-primary" : "opacity-70",
                                            isCollapsed && "mx-auto"
                                        )}
                                    />
                                    {!isCollapsed && <span className="text-sm font-bold">{item.label}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-white/5">
                <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm hover:bg-red-500/10 text-red-500 transition-all opacity-60 hover:opacity-100 cursor-pointer">
                    <LogOut size={16} />
                    {!isCollapsed && <span className="text-xs font-black tracking-widest uppercase">Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
