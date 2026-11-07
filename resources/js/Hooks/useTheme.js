import { useState, useEffect, useCallback } from 'react';

/**
 * useTheme Hook:
 * Manages 'system' | 'dark' | 'light' theme preference with automatic
 * system detection and real-time OS preference change listening.
 */
export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') return 'system';
        return localStorage.getItem('app_theme') || 'system';
    });

    const [resolvedTheme, setResolvedTheme] = useState(() => {
        if (typeof window === 'undefined') return 'dark';
        const saved = localStorage.getItem('app_theme') || 'system';
        if (saved === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return saved;
    });

    const applyTheme = useCallback((targetTheme) => {
        let isDark = false;
        if (targetTheme === 'system') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
            isDark = targetTheme === 'dark';
        }

        const effective = isDark ? 'dark' : 'light';
        setResolvedTheme(effective);

        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }

        root.setAttribute('data-theme', effective);
        root.setAttribute('data-theme-preference', targetTheme);
    }, []);

    const setTheme = useCallback(
        (newTheme) => {
            setThemeState(newTheme);
            if (typeof window !== 'undefined') {
                localStorage.setItem('app_theme', newTheme);
                applyTheme(newTheme);
            }
        },
        [applyTheme]
    );

    // Initial application and system media query listener
    useEffect(() => {
        applyTheme(theme);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const currentSaved = localStorage.getItem('app_theme') || 'system';
            if (currentSaved === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, applyTheme]);

    return {
        theme, // 'system' | 'dark' | 'light'
        resolvedTheme, // 'dark' | 'light'
        setTheme,
    };
}
