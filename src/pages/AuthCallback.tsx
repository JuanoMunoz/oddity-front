import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../hooks/useAuth';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (!isPending) {
            if (session) {
                // Lógica de detección: ¿Es nuevo usuario?
                // Opción A: Revisar si se creó hace menos de 10 segundos
                const createdAt = new Date(session.user.createdAt).getTime();
                const now = Date.now();
                const isNewUser = (now - createdAt) < 10000; // 10 segundos de ventana

                // Opción B (Más segura): Revisar si le faltan datos de perfil
                // const isNewUser = !session.user.organizationId;

                if (isNewUser) {
                    navigate('/onboarding');
                } else {
                    navigate('/panel');
                }
            } else {
                // Si no hay sesión después de cargar, algo falló
                navigate('/login');
            }
        }
    }, [session, isPending, navigate]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-8 h-8 animate-pulse" />
            </div>

            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-[0.2em] mb-2 dark:text-white text-secondary uppercase">
                    Autenticando
                </h2>
                <p className="dark:opacity-50 text-slate-500 font-medium animate-pulse">
                    Configurando tu espacio de trabajo inteligente...
                </p>
            </div>
        </div>
    );
};

export default AuthCallback;
