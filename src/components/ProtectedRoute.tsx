import { useApp } from "../hooks/useApp";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useApp();
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    return <>{children}</>;
}