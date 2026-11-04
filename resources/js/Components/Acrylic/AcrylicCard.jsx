import React from 'react';

/**
 * AcrylicCard: Reusable Smoked Acrylic container primitive.
 * Surface: bg-[#0F111A]/85 backdrop-blur-md border border-white/[0.07]
 * Highlight: Specular top-edge inset shadow
 */
export default function AcrylicCard({
    children,
    title,
    subtitle,
    headerAction,
    className = '',
    contentClassName = '',
    elevated = false,
    ...props
}) {
    const baseStyle = elevated
        ? 'bg-[#0E1017] border border-white/[0.08] shadow-[0_16px_36px_-8px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.06)]'
        : 'bg-[#0B0D13] border border-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]';

    return (
        <div
            className={`rounded-xl transition-all duration-150 overflow-hidden ${baseStyle} ${className}`}
            {...props}
        >
            {(title || headerAction) && (
                <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center justify-between gap-4">
                    <div>
                        {title && (
                            <h3 className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-2">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
                </div>
            )}
            <div className={`p-5 ${contentClassName}`}>{children}</div>
        </div>
    );
}

