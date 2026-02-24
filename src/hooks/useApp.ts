import { useContext } from 'react';
import { InternalAppContext } from '../context/AppContext';
import { authClient } from './useAuth';

export const useApp = () => {
    const context = useContext(InternalAppContext);
    const { data: session, isPending, error: authError } = authClient.useSession();
    console.log("session", session);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }

    // Derivamos toda la lógica aquí
    const user = session?.user || null;
    const isAdmin = user?.role === 'admin';
    const isSuperAdmin = user?.role === 'superadmin';
    const isAuthenticated = !!session;
    const isDark = context.theme === 'dark';
    const isLoading = isPending;
    const userName = user?.name || 'Invitado';

    return {
        // Estado
        user,
        isAuthenticated,
        isDark,
        isAdmin,
        isSuperAdmin,
        isLoading,
        userName,
        theme: context.theme,
        authError,
        // Acciones de UI
        toggleTheme: context.toggleTheme,
    };
};
