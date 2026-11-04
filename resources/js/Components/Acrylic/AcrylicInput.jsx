import React from 'react';

/**
 * AcrylicInput: Smoked Acrylic text/number input primitive with label and error support.
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
                    className="block text-xs font-medium text-slate-300"
                >
                    {label} {required && <span className="text-rose-400">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                <input
                    id={inputId}
                    type={type}
                    required={required}
                    className={`w-full bg-[#0B0D13] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 shadow-[inset_0_1px_0_0_rgba(0,0,0,0.5)] transition-all ${
                        Icon ? 'pl-9 pr-3.5 py-2' : 'px-3.5 py-2'
                    } ${error ? 'border-rose-500/60 focus:border-rose-400' : ''} ${inputClassName}`}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-[11px] text-rose-400 font-medium tracking-tight animate-in fade-in">
                    {error}
                </p>
            )}
        </div>
    );
}

