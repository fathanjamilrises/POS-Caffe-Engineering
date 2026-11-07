import React from 'react';

/**
 * AcrylicBadge: Smoked Tinted Pill for semantic operational states.
 */
export default function AcrylicBadge({
    children,
    variant = 'neutral',
    size = 'md',
    className = '',
    dot = false,
}) {
    const variants = {
        emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
        amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
        rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
        indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20',
        cobalt: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
        neutral: 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]',
    };

    const dotColors = {
        emerald: 'bg-emerald-400',
        amber: 'bg-amber-400',
        rose: 'bg-rose-400',
        indigo: 'bg-indigo-400',
        cobalt: 'bg-blue-400',
        neutral: 'bg-slate-400',
    };

    const sizes = {
        sm: 'text-[10px] px-2 py-0.5 tracking-wider',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
    };

    const currentVariant = variants[variant] || variants.neutral;
    const currentDot = dotColors[variant] || dotColors.neutral;
    const currentSize = sizes[size] || sizes.md;

    return (
        <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full border backdrop-blur-xs select-none ${currentVariant} ${currentSize} ${className}`}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />}
            {children}
        </span>
    );
}

