import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AppContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const InternalAppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {

        return (localStorage.getItem('oddity-theme') as 'light' | 'dark') || 'dark';
    });

    useEffect(() => {
        localStorage.setItem('oddity-theme', theme);
        document.body.className = theme;
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <InternalAppContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </InternalAppContext.Provider>
    );
};
