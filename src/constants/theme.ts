/**
 * Tokens de diseño para Brújula — soporta dark y light mode.
 */

export const lightColors = {
    bg: '#f8fafc',
    bgCard: '#ffffff',
    bgMuted: '#f1f5f9',

    text: '#0f172a',
    textSecond: '#475569',
    textMuted: '#94a3b8',

    primary: '#7c3aed',
    primaryLight: '#ede9fe',

    border: '#e2e8f0',
    borderFocus: '#7c3aed',

    verde: '#22c55e',
    amarillo: '#eab308',
    rojo: '#ef4444',

    danger: '#ef4444',
    dangerLight: '#fee2e2',

    white: '#ffffff',
    black: '#000000',
};

export const darkColors: typeof lightColors = {
    bg: '#0f172a',
    bgCard: '#1e293b',
    bgMuted: '#1e293b',

    text: '#f1f5f9',
    textSecond: '#94a3b8',
    textMuted: '#64748b',

    primary: '#7c3aed',
    primaryLight: '#2e1065',

    border: '#334155',
    borderFocus: '#7c3aed',

    verde: '#22c55e',
    amarillo: '#eab308',
    rojo: '#ef4444',

    danger: '#ef4444',
    dangerLight: '#450a0a',

    white: '#ffffff',
    black: '#000000',
};

export type AppColors = typeof lightColors;

export const radii = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 999,
};

export const spacing = {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

export const shadow = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
};
