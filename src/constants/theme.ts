/**
 * Tokens de diseño compartidos para Brújula.
 * Import en cualquier componente: import { colors, type, radii, spacing } from '../constants/theme';
 */

export const colors = {
    // Fondo
    bg: '#f8fafc',
    bgCard: '#ffffff',
    bgMuted: '#f1f5f9',

    // Texto
    text: '#0f172a',
    textSecond: '#475569',
    textMuted: '#94a3b8',

    // Marca / primario
    primary: '#7c3aed',       // Violeta brújula
    primaryLight: '#ede9fe',
    primaryDark: '#5b21b6',

    // Semáforo
    verde: '#22c55e',
    amarillo: '#eab308',
    rojo: '#ef4444',

    // Bordes
    border: '#e2e8f0',
    borderFocus: '#7c3aed',

    // Danger
    danger: '#ef4444',
    dangerLight: '#fee2e2',

    // Extra
    white: '#ffffff',
    black: '#000000',
};

export const type = {
    // Familias
    default: 'System',    // expo-font sin configuración adicional

    // Tamaños
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,

    // Pesos
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
};

export const radii = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 999,
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
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
