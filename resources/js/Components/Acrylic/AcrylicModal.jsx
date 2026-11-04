import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * AcrylicModal: Elevated Smoked Acrylic dialog primitive.
 * Positioned at center-top of the main layout, rendered via portal with full-viewport backdrop.
 */
export default function AcrylicModal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    maxWidth = 'max-w-lg',
    footer = null,
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex justify-center items-start pt-14 sm:pt-20 p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
            {/* Backdrop covering entire layout utama (including sidebar and navbar) */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog Card at Center Top of Layout Utama */}
            <div
                className={`relative w-full ${maxWidth} bg-[#0B0D13] border border-white/[0.08] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-xl text-slate-100 z-10 overflow-hidden my-4 sm:my-6 animate-in zoom-in-95 duration-150`}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
                    <div>
                        {title && (
                            <h2 className="text-sm font-semibold tracking-wide text-white">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors focus:outline-none"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="px-6 py-5 max-h-[calc(85vh-140px)] overflow-y-auto">
                    {children}
                </div>

                {/* Optional Footer */}
                {footer && (
                    <div className="px-6 py-3.5 border-t border-white/[0.06] bg-[#08090D] flex items-center justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
