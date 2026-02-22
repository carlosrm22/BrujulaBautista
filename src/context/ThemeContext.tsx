import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type AppColors } from '../constants/theme';
import { getSetting, setSetting } from '../db/settings';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
    theme: 'light' | 'dark';   // tema resuelto efectivo
    mode: ThemeMode;            // preferencia del usuario
    colors: AppColors;
    toggleTheme: () => void;    // alterna light ↔ dark (sobreescribe sistema)
    setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme();                    // 'light' | 'dark' | null
    const [mode, setModeState] = useState<ThemeMode>('system');

    // Cargar preferencia guardada al arrancar
    useEffect(() => {
        getSetting('app_theme').then((val) => {
            if (val === 'light' || val === 'dark' || val === 'system') {
                setModeState(val);
            }
        });
    }, []);

    // Tema efectivo: si es 'system' delegamos al OS
    const effectiveTheme: 'light' | 'dark' =
        mode === 'system' ? (systemScheme ?? 'light') : mode;

    const colors = effectiveTheme === 'dark' ? darkColors : lightColors;

    const setMode = (m: ThemeMode) => {
        setModeState(m);
        setSetting('app_theme', m);
    };

    const toggleTheme = () => {
        const next = effectiveTheme === 'dark' ? 'light' : 'dark';
        setMode(next);
    };

    return (
        <ThemeContext.Provider
            value={{ theme: effectiveTheme, mode, colors, toggleTheme, setMode }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}
