import React from 'react';

/**
 * AcrylicInput: Precision input primitive with large readable typography.
 * Sized for comfortable typing and accessibility (min 44px height, 14px text).
 */
export default function AcrylicInput({
    label,
    error,
    id,
    type = 'text',
    className = '',
    inputClassName = '',
    icon: Icon = null,
    required = false,
    ...props
}) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-slate-200"
                >
                    {label} {required && <span className="text-rose-400">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                <input
                    id={inputId}
                    type={type}
                    required={required}
                    className={`w-full bg-[#08090D] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 py-2.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-colors shadow-[inset_0_1px_0_0_rgba(0,0,0,0.4)] ${
                        Icon ? 'pl-10 pr-3.5' : 'px-3.5'
                    } ${error ? 'border-rose-500/70 focus:border-rose-400' : ''} ${inputClassName}`}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-rose-400 font-medium tracking-tight animate-in fade-in">
                    {error}
                </p>
            )}
        </div>
    );
}
