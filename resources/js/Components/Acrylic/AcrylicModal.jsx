import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * AcrylicModal: Clean, high-accessibility dialog primitive.
 * Optimized for staff aged 40-60:
 * - High-contrast backdrop and card surface (#0C0E16)
 * - Large readable typography (18px title, 14px description)
 * - Large touch-friendly close button (min 40x40px)
 * - Accessible keyboard navigation (Escape to close)
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
        <div className="fixed inset-0 z-[100] flex justify-center items-start pt-10 sm:pt-16 p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
            {/* Backdrop Overlay */}
            <div
                className="fixed inset-0 bg-black/75 transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog Card */}
            <div
                className={`relative w-full ${maxWidth} bg-white dark:bg-[#0C0E16] border border-slate-200 dark:border-white/[0.1] shadow-2xl rounded-2xl text-slate-900 dark:text-slate-100 z-10 overflow-hidden my-4 sm:my-6 animate-in zoom-in-95 duration-150`}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/[0.08] flex items-start justify-between gap-4 bg-white dark:bg-[#0C0E16]">
                    <div className="space-y-1">
                        {title && (
                            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 -mr-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors shrink-0"
                        title="Tutup (Esc)"
                        aria-label="Tutup jendela"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="px-6 py-5 sm:py-6 max-h-[calc(85vh-160px)] overflow-y-auto bg-white dark:bg-[#0C0E16]">
                    {children}
                </div>

                {/* Optional Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#090B12] flex items-center justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
