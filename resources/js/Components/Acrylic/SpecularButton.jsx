import React from 'react';

/**
 * SpecularButton: Tactile physical button primitive with specular top inner highlight.
 */
export default function SpecularButton({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon = null,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    className = '',
    type = 'button',
    ...props
}) {
    const baseClasses =
        'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
        primary:
            'bg-gradient-to-b from-[#4338CA] to-[#312E81] hover:from-[#4F46E5] hover:to-[#3730A3] text-white border border-indigo-400/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_1px_2px_rgba(0,0,0,0.4)]',
        secondary:
            'bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',
        accent:
            'bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-500/30 shadow-[inset_0_1px_0_0_rgba(165,180,252,0.10)]',
        danger:
            'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',
        ghost:
            'bg-transparent hover:bg-white/[0.05] text-slate-400 hover:text-white border border-transparent hover:border-white/[0.08]',
    };

    const sizes = {
        sm: 'text-xs px-2.5 py-1.5 gap-1.5',
        md: 'text-sm px-4 py-2 gap-2',
        lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin -ml-0.5 h-4 w-4 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {!loading && Icon && iconPosition === 'left' && (
                <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            )}
            {children}
            {!loading && Icon && iconPosition === 'right' && (
                <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            )}
        </button>
    );
}

