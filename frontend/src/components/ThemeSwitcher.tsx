'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme definitions - each with distinct, recognizable colors
export const THEMES = {
    default: {
        name: 'Default',
        icon: '🌙',
        colors: {
            primary: '#8b5cf6',      // Purple
            secondary: '#6366f1',
            accent: '#22d3ee',
            background: '#0f0f23',   // Dark blue-black
            surface: '#1a1a2e',
            text: '#ffffff',
            textMuted: '#a0a0b0'
        }
    },
    ocean: {
        name: 'Ocean',
        icon: '🌊',
        colors: {
            primary: '#00bcd4',      // Cyan
            secondary: '#0097a7',
            accent: '#00e5ff',
            background: '#001f3f',   // Deep ocean blue
            surface: '#003366',
            text: '#e0f7fa',
            textMuted: '#80deea'
        }
    },
    sunset: {
        name: 'Sunset',
        icon: '🌅',
        colors: {
            primary: '#ff7043',      // Orange
            secondary: '#ff5722',
            accent: '#ffab40',
            background: '#2d1b1b',   // Dark warm brown
            surface: '#4a2c2a',
            text: '#fff8e1',
            textMuted: '#ffcc80'
        }
    },
    forest: {
        name: 'Forest',
        icon: '🌲',
        colors: {
            primary: '#4caf50',      // Green
            secondary: '#388e3c',
            accent: '#8bc34a',
            background: '#0d2818',   // Deep forest green
            surface: '#1b4332',
            text: '#e8f5e9',
            textMuted: '#a5d6a7'
        }
    },
    lavender: {
        name: 'Lavender',
        icon: '💜',
        colors: {
            primary: '#ba68c8',      // Light purple
            secondary: '#9c27b0',
            accent: '#e1bee7',
            background: '#1a0a2e',   // Deep purple
            surface: '#2d1b4e',
            text: '#f3e5f5',
            textMuted: '#ce93d8'
        }
    },
    midnight: {
        name: 'Midnight',
        icon: '🌌',
        colors: {
            primary: '#5c6bc0',      // Indigo
            secondary: '#3949ab',
            accent: '#7986cb',
            background: '#000010',   // Almost pure black with blue hint
            surface: '#0a0a20',
            text: '#c5cae9',
            textMuted: '#7986cb'
        }
    },
    cherry: {
        name: 'Cherry',
        icon: '🍒',
        colors: {
            primary: '#e91e63',      // Pink/Red
            secondary: '#c2185b',
            accent: '#f48fb1',
            background: '#1a0a0f',   // Dark red
            surface: '#2d1520',
            text: '#fce4ec',
            textMuted: '#f48fb1'
        }
    },
    light: {
        name: 'Light',
        icon: '☀️',
        colors: {
            primary: '#1976d2',      // Blue
            secondary: '#1565c0',
            accent: '#42a5f5',
            background: '#fafafa',   // Almost white
            surface: '#ffffff',
            text: '#212121',
            textMuted: '#757575'
        }
    }
};

export type ThemeKey = keyof typeof THEMES;

interface ThemeContextType {
    theme: ThemeKey;
    setTheme: (theme: ThemeKey) => void;
    colors: typeof THEMES.default.colors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeKey>('default');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load saved theme
        const saved = localStorage.getItem('erlandx-theme') as ThemeKey;
        if (saved && THEMES[saved]) {
            setThemeState(saved);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Apply theme CSS variables
        const colors = THEMES[theme].colors;
        const root = document.documentElement;

        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-secondary', colors.secondary);
        root.style.setProperty('--color-accent', colors.accent);
        root.style.setProperty('--color-background', colors.background);
        root.style.setProperty('--color-surface', colors.surface);
        root.style.setProperty('--color-text', colors.text);
        root.style.setProperty('--color-text-muted', colors.textMuted);

        // Set body styles directly with transition
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        document.body.style.backgroundColor = colors.background;
        document.body.style.color = colors.text;

        // Handle light theme class
        if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        }
    }, [theme, mounted]);

    const setTheme = (newTheme: ThemeKey) => {
        setThemeState(newTheme);
        localStorage.setItem('erlandx-theme', newTheme);
    };

    const colors = THEMES[theme].colors;

    // Don't render with theme until mounted (prevents hydration mismatch)
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, colors }}>
            <div
                className="min-h-screen transition-colors duration-300"
                style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    '--theme-primary': colors.primary,
                    '--theme-secondary': colors.secondary,
                    '--theme-surface': colors.surface,
                    '--theme-accent': colors.accent,
                } as React.CSSProperties}
            >
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}

// Theme Switcher UI Component
export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-gray-700"
                title="Change Theme"
            >
                <span className="text-lg">{THEMES[theme].icon}</span>
                <span className="text-sm text-gray-300 hidden sm:inline">{THEMES[theme].name}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-gray-800 border border-gray-700 shadow-xl z-50 overflow-hidden">
                        <div className="p-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wider px-2 py-1">Select Theme</p>
                            {Object.entries(THEMES).map(([key, value]) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setTheme(key as ThemeKey);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${theme === key
                                        ? 'bg-blue-600/20 text-blue-400'
                                        : 'hover:bg-gray-700/50 text-gray-300'
                                        }`}
                                >
                                    <span className="text-lg">{value.icon}</span>
                                    <span className="flex-1 text-left">{value.name}</span>
                                    {theme === key && (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Preview bar */}
                        <div className="border-t border-gray-700 p-2">
                            <div className="flex gap-1">
                                {Object.values(THEMES[theme].colors).slice(0, 5).map((color, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 h-2 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
