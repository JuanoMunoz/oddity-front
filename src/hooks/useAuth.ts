import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { useState, useEffect, useCallback } from "react";
import z from "zod";
import { SignUp, SignIn } from "../interface/Auth/user-scheme";
import type { SignUpData, SignInData } from "../interface/Auth/user-scheme";
import { API_URL } from "../lib/oddityClient";
export const authClient = createAuthClient({
    baseURL: API_URL,
    plugins: [
        adminClient(),
        inferAdditionalFields({
            user: {
                organizationId: { type: "number" },
                role: { type: "string" }
            }
        })
    ]
});

authClient.updateUser()
const getProviderConfig = (provider: string) => {
    return {
        provider: provider,
        callbackURL: `${window.location.origin}/auth/callback`,
        errorCallbackURL: `${window.location.origin}/login`
    }
}

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async (data: SignUpData) => {
        setLoading(true);
        setError(null);
        try {
            const validatedData = SignUp.parse(data);
            const res = await authClient.signUp.email(validatedData);
            if (res.error) setError(res.error.message ?? 'Error desconocido');
            return res;
        } catch (err) {
            if (err instanceof z.ZodError) setError("Datos inválidos");
            else setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async (data: SignInData) => {
        setLoading(true);
        setError(null);
        try {
            const validatedData = SignIn.parse(data);
            const res = await authClient.signIn.email(validatedData);
            if (res.error) setError(res.error.message ?? 'Error desconocido');
            return res;
        } catch (err) {
            setError("Credenciales inválidas");
        } finally {
            setLoading(false);
        }
    };

    const handleMicrosoftSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await authClient.signIn.social(getProviderConfig("microsoft"));
        } catch (err) {
            setError("Error de conexión con Microsoft");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await authClient.signIn.social(getProviderConfig("google"));
        } catch (err) {
            setError("Error de conexión con Google");
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        await authClient.signOut();
        setLoading(false);
    };

    return {
        handleSignUp,
        handleMicrosoftSignIn,
        handleGoogleSignIn,
        handleSignIn,
        logout,
        loading,
        error,
    };
};

export type UserRole = 'user' | 'admin' | 'superadmin';

// Mirror of what the backend defines in adminRoles
export const ADMIN_ROLES: UserRole[] = ['admin', 'superadmin'];

// What each role is allowed to assign to others
// admin can assign 'user' or 'admin', but NOT 'superadmin' (privilege escalation protection)
// superadmin can assign any role
export const ASSIGNABLE_ROLES: Record<UserRole, UserRole[]> = {
    user: [],
    admin: ['user', 'admin'],
    superadmin: ['user', 'admin', 'superadmin'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
    user: 'Usuario',
    admin: 'Admin',
    superadmin: 'Super Admin',
};

export const useAdminUsers = (callerRole: UserRole = 'user') => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        // Only admin-role users can call this - backend will reject 'user' role with 403
        if (!ADMIN_ROLES.includes(callerRole)) {
            setError('Sin permisos suficientes');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await authClient.admin.listUsers({ query: {} });
            if (res.error) {
                setError(res.error.message ?? "Error al cargar usuarios");
            } else {
                setUsers(res.data?.users ?? []);
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    }, [callerRole]);

    const setRole = async (userId: string, role: UserRole) => {
        // Enforce client-side: caller cannot assign a role higher than their own
        const allowed = ASSIGNABLE_ROLES[callerRole] ?? [];
        if (!allowed.includes(role)) {
            setError(`No puedes asignar el rol "${ROLE_LABELS[role]}" con tu nivel de acceso.`);
            return;
        }

        setUpdatingId(userId);
        setError(null);
        try {
            const res = await authClient.admin.setRole({ userId, role: role as any });
            if (res.error) {
                setError(res.error.message ?? "Error al actualizar rol");
            } else {
                // Update locally to avoid refetch
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setUpdatingId(null);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, loading, updatingId, error, fetchUsers, setRole };
};

export const useUpdateUser = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const updateName = useCallback(async (name: string) => {
        if (!name.trim() || name.trim().length < 2) {
            setError('El nombre debe tener al menos 2 caracteres.');
            return false;
        }
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await authClient.updateUser({ name: name.trim() });
            if (res.error) {
                setError(res.error.message ?? 'Error al actualizar el perfil.');
                return false;
            }
            setSuccess(true);
            // Auto-clear success after 3s
            setTimeout(() => setSuccess(false), 3000);
            return true;
        } catch {
            setError('Error de conexión. Inténtalo de nuevo.');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return { updateName, loading, error, success };
};

