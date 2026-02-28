// src/Themes/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Accent Color Presets ───────────────────────────────────────────
export const ACCENT_COLORS = [
    { name: 'Teal', hex: '#008080' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Purple', hex: '#9333EA' },
    { name: 'Rose', hex: '#E11D48' },
    { name: 'Orange', hex: '#EA580C' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Cyan', hex: '#0891B2' },
    { name: 'Amber', hex: '#D97706' },
    { name: 'Pink', hex: '#DB2777' },
];

// ─── Helper: Lighten / Darken a HEX color ──────────────────────────
const adjustColor = (hex, amount) => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// ─── Build theme object from mode + accent color ───────────────────
export const buildTheme = (mode = 'light', accent = '#008080') => {
    const isDark = mode === 'dark';
    const secondary = adjustColor(accent, isDark ? 40 : 30);

    return {
        mode,
        accent,
        colors: {
            primary: accent,
            secondary,
            background: isDark ? '#121212' : '#FFFFFF',
            surface: isDark ? '#1E1E1E' : '#F9FAFB',
            card: isDark ? '#1E1E2E' : '#FFFFFF',
            text: isDark ? '#E5E7EB' : '#000000',
            textSecondary: isDark ? '#9CA3AF' : '#6B7280',
            tabInactive: isDark ? '#6B7280' : '#777777',
            border: isDark ? '#2D2D3D' : '#DDDDDD',
            shadow: isDark ? '#000000' : '#000000',
            borderSubtle: isDark ? '#2D2D3D' : '#e9ecef',
            borderMuted: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',

            // Dashboard card colors (adapt to accent)
            project: accent,
            task: secondary,
            meeting: '#FF6B6B',
            event: '#FFA500',
            timesheet: '#6A5ACD',
            ticket: '#515795ff',

            // Status and utility
            success: '#2ECC71',
            error: '#E74C3C',
            white: '#FFFFFF',
            black: '#000000',
            gray: isDark ? '#9CA3AF' : '#888888',

            // Overlays
            overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
            overlayLight: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',

            // Soft backgrounds
            projectSoft: isDark ? `${accent}20` : '#E6F7F5',
            taskSoft: isDark ? `${secondary}20` : '#E6FCF9',
            meetingSoft: isDark ? '#FF6B6B20' : '#FFF5F5',
            eventSoft: isDark ? '#FFA50020' : '#FFF8F0',
            sectionBg: isDark ? '#1A1A2E' : '#EDF8F2FF',

            // Neutral shades
            muted100: isDark ? '#2D2D3D' : '#F3F4F6',
            muted200: isDark ? '#3D3D4D' : '#E5E7EB',
            textMuted: isDark ? '#6B7280' : '#64748B',
            thumbInactive: isDark ? '#3D3D4D' : '#f4f3f4',

            // Success shades
            successSoft: isDark ? '#065F4620' : '#ECFDF5',
            successBorder: isDark ? '#2ECC7140' : '#BBF7D0',
            successText: isDark ? '#34D399' : '#065F46',
        },
        fonts: {
            regular: 'System',
            medium: 'System',
            bold: 'System',
        },
        spacing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
        },
        radius: {
            sm: 6,
            md: 12,
            lg: 20,
        },
    };
};

// ─── Persistence keys ───────────────────────────────────────────────
const STORAGE_KEY_MODE = '@app_theme_mode';
const STORAGE_KEY_ACCENT = '@app_theme_accent';

// ─── Context ────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [mode, setModeState] = useState('light');
    const [accent, setAccentState] = useState('#008080');
    const [ready, setReady] = useState(false);

    // Load stored preferences on mount
    useEffect(() => {
        (async () => {
            try {
                const [storedMode, storedAccent] = await AsyncStorage.multiGet([STORAGE_KEY_MODE, STORAGE_KEY_ACCENT]);
                if (storedMode[1]) setModeState(storedMode[1]);
                if (storedAccent[1]) setAccentState(storedAccent[1]);
            } catch { }
            setReady(true);
        })();
    }, []);

    const setMode = useCallback(async (m) => {
        setModeState(m);
        try { await AsyncStorage.setItem(STORAGE_KEY_MODE, m); } catch { }
    }, []);

    const setAccent = useCallback(async (c) => {
        setAccentState(c);
        try { await AsyncStorage.setItem(STORAGE_KEY_ACCENT, c); } catch { }
    }, []);

    const toggleMode = useCallback(() => {
        setMode(mode === 'light' ? 'dark' : 'light');
    }, [mode, setMode]);

    const theme = useMemo(() => buildTheme(mode, accent), [mode, accent]);

    const value = useMemo(() => ({
        theme,
        mode,
        accent,
        setMode,
        setAccent,
        toggleMode,
        isDark: mode === 'dark',
    }), [theme, mode, accent, setMode, setAccent, toggleMode]);

    if (!ready) return null; // Wait for AsyncStorage to load

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        // Fallback if used outside provider (shouldn't happen)
        return {
            theme: buildTheme('light', '#008080'),
            mode: 'light',
            accent: '#008080',
            setMode: () => { },
            setAccent: () => { },
            toggleMode: () => { },
            isDark: false,
        };
    }
    return ctx;
};

export default ThemeContext;
