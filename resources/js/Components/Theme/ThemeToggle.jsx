import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme } from '@/Hooks/useTheme';

export default function ThemeToggle({ className = '' }) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const options = [
        {
            id: 'system',
            label: 'Ikuti Sistem',
            description: 'Otomatis sesuai setelan OS',
            icon: Laptop,
        },
        {
            id: 'dark',
            label: 'Mode Gelap',
            description: 'Obsidian Ultramarine',
            icon: Moon,
        },
        {
            id: 'light',
            label: 'Mode Terang',
            description: 'Crisp Alabaster Canteen',
            icon: Sun,
        },
    ];

    // Current display icon
    const CurrentIcon = theme === 'system' ? Laptop : resolvedTheme === 'dark' ? Moon : Sun;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                    isOpen
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-600/20 dark:border-indigo-500/40 dark:text-indigo-300'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.08] shadow-xs dark:shadow-none'
                }`}
                title={`Tema: ${theme === 'system' ? 'Mengikuti Sistem' : theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}`}
                aria-label="Pilih Tema Tampilan"
            >
                <CurrentIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#0B0D13] border border-slate-200 dark:border-white/[0.1] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-white/[0.06] mb-1">
                        Pilihan Tema Tampilan
                    </div>

                    <div className="space-y-0.5">
                        {options.map((opt) => {
                            const Icon = opt.icon;
                            const isSelected = theme === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                        setTheme(opt.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                                        isSelected
                                            ? 'bg-indigo-50 border border-indigo-200 shadow-xs dark:bg-[#1E1B4B] dark:border-indigo-500/40'
                                            : 'hover:bg-slate-100 border border-transparent dark:hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-400'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div
                                                className={`text-xs truncate ${
                                                    isSelected
                                                        ? 'font-bold text-indigo-950 dark:text-white'
                                                        : 'font-medium text-slate-800 dark:text-slate-200'
                                                }`}
                                            >
                                                {opt.label}
                                            </div>
                                            <div
                                                className={`text-[10px] truncate font-mono mt-0.5 ${
                                                    isSelected
                                                        ? 'font-medium text-indigo-700 dark:text-indigo-300'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                }`}
                                            >
                                                {opt.description}
                                            </div>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
