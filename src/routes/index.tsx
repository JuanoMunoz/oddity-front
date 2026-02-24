import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import Home from '../pages/Home';
import About from '../pages/About';
import Auth from '../pages/Auth';
import AuthCallback from '../pages/AuthCallback';
import Onboarding from '../pages/Onboarding';
import { Panel } from '../pages/Panel';
import ProtectedRoute from '../components/ProtectedRoute';
export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'about',
                element: <About />,
            },
            {
                path: 'login',
                element: <Auth />,
            },
            {
                path: 'register',
                element: <Auth />,
            },
            {
                path: 'auth/callback',
                element: <AuthCallback />,
            },
            {
                path: 'onboarding',
                element: <ProtectedRoute><Onboarding /></ProtectedRoute>,
            },
            {
                path: 'panel',
                element: <ProtectedRoute><Panel /></ProtectedRoute>,
            },
        ],
    },
]);
