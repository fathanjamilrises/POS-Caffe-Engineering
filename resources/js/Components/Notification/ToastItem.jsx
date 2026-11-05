import React, { useState, useEffect, useRef } from 'react';
import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    X,
    ArrowRight,
} from 'lucide-react';

const TYPE_CONFIG = {
    success: {
        label: 'BERHASIL',
        Icon: CheckCircle2,
        badgeStyle: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        cardBorder: 'border-emerald-500/30',
        cardShadow: 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8),0_0_15px_rgba(16,185,129,0.12)]',
        headerText: 'text-emerald-400',
        progressGradient: 'from-emerald-500 via-emerald-400 to-teal-300',
    },
    error: {
        label: 'KENDALA',
        Icon: AlertCircle,
        badgeStyle: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        cardBorder: 'border-rose-500/30',
        cardShadow: 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8),0_0_15px_rgba(244,63,94,0.12)]',
        headerText: 'text-rose-400',
        progressGradient: 'from-rose-500 via-rose-400 to-red-400',
    },
    warning: {
        label: 'PERINGATAN',
        Icon: AlertTriangle,
        badgeStyle: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        cardBorder: 'border-amber-500/30',
        cardShadow: 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8),0_0_15px_rgba(245,158,11,0.12)]',
        headerText: 'text-amber-400',
        progressGradient: 'from-amber-500 via-amber-400 to-yellow-300',
    },
    info: {
        label: 'INFORMASI',
        Icon: Info,
        badgeStyle: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
        cardBorder: 'border-indigo-500/35',
        cardShadow: 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8),0_0_15px_rgba(99,102,241,0.14)]',
        headerText: 'text-indigo-300',
        progressGradient: 'from-indigo-500 via-blue-400 to-indigo-300',
    },
};

export default function ToastItem({ toast, onDismiss }) {
    const { id, type = 'info', title, message, duration = 4200, action, isExiting } = toast;
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
    const { Icon } = config;

    const [isHovered, setIsHovered] = useState(false);
    const remainingRef = useRef(duration);
    const startTimeRef = useRef(Date.now());
    const timerRef = useRef(null);

    // Auto-dismiss countdown logic with hover pause
    useEffect(() => {
        if (duration <= 0 || isExiting) return;

        if (!isHovered) {
            startTimeRef.current = Date.now();
            timerRef.current = setTimeout(() => {
                onDismiss(id);
            }, remainingRef.current);
        } else {
            // Pause timer and calculate elapsed time
            clearTimeout(timerRef.current);
            const elapsed = Date.now() - startTimeRef.current;
            remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        }

        return () => clearTimeout(timerRef.current);
    }, [isHovered, duration, id, isExiting, onDismiss]);

    // Format current timestamp
    const timeString = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`w-full max-w-[380px] sm:max-w-[420px] rounded-xl bg-[#0B0D15]/95 backdrop-blur-xl border ${
                config.cardBorder
            } ${config.cardShadow} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-all duration-200 select-none ${
                isExiting ? 'animate-toast-exit pointer-events-none' : 'animate-toast-enter pointer-events-auto'
            }`}
            role="alert"
            aria-live="assertive"
        >
            <div className="p-3.5 flex items-start gap-3">
                {/* Status Indicator Icon */}
                <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-sm ${config.badgeStyle}`}
                >
                    <Icon className="w-4 h-4" />
                </div>

                {/* Message & Context Body */}
                <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span
                            className={`text-[10px] font-bold tracking-wider uppercase font-mono ${config.headerText}`}
                        >
                            {title || config.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                            {timeString}
                        </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-200 leading-snug break-words">
                        {message}
                    </p>

                    {/* Interactive Action Button (if specified) */}
                    {action && (
                        <button
                            type="button"
                            onClick={() => {
                                action.onClick?.();
                                onDismiss(id);
                            }}
                            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-slate-200 transition-all active:scale-95 shadow-sm"
                        >
                            <span>{action.label}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                    )}
                </div>

                {/* Dismiss Button */}
                <button
                    type="button"
                    onClick={() => onDismiss(id)}
                    className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] flex items-center justify-center transition-colors shrink-0 active:scale-90"
                    title="Tutup notifikasi"
                    aria-label="Tutup notifikasi"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Bottom Linear Progress Bar */}
            {duration > 0 && (
                <div className="h-[2px] w-full bg-white/[0.05] overflow-hidden rounded-b-xl">
                    <div
                        className={`h-full bg-gradient-to-r ${config.progressGradient} animate-toast-progress`}
                        style={{
                            animationDuration: `${duration}ms`,
                            animationPlayState: isHovered ? 'paused' : 'running',
                        }}
                    />
                </div>
            )}
        </div>
    );
}

