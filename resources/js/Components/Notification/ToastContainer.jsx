import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import ToastItem from './ToastItem';
import { toast } from '@/Services/toast';

const MAX_VISIBLE_TOASTS = 4;

export default function ToastContainer() {
    const [toasts, setToasts] = useState([]);
    const page = usePage();
    const flash = page?.props?.flash || {};
    const lastFlashRef = useRef('');

    // Dismiss handler with smooth exit animation
    const handleDismiss = useCallback((id) => {
        setToasts((prev) =>
            prev.map((item) => (item.id === id ? { ...item, isExiting: true } : item))
        );

        // Remove from DOM after exit animation completes
        setTimeout(() => {
            setToasts((prev) => prev.filter((item) => item.id !== id));
        }, 260);
    }, []);

    // Listen to custom window events from toast service
    useEffect(() => {
        const handlePush = (e) => {
            const newToast = e.detail;
            if (!newToast) return;

            setToasts((prev) => {
                // Prevent duplicate toasts within 800ms
                const isDuplicate = prev.some(
                    (t) =>
                        t.message === newToast.message &&
                        Date.now() - t.createdAt < 800 &&
                        !t.isExiting
                );
                if (isDuplicate) return prev;

                // If stack exceeds maximum capacity, retire oldest toast gracefully
                let updated = [...prev];
                const activeCount = updated.filter((t) => !t.isExiting).length;
                if (activeCount >= MAX_VISIBLE_TOASTS) {
                    const firstActiveIndex = updated.findIndex((t) => !t.isExiting);
                    if (firstActiveIndex !== -1) {
                        updated[firstActiveIndex] = {
                            ...updated[firstActiveIndex],
                            isExiting: true,
                        };
                        setTimeout(() => {
                            setToasts((current) =>
                                current.filter((t) => t.id !== updated[firstActiveIndex].id)
                            );
                        }, 260);
                    }
                }

                return [...updated, newToast];
            });
        };

        const handleDismissEvent = (e) => {
            if (e.detail?.id) {
                handleDismiss(e.detail.id);
            }
        };

        const handleClearEvent = () => {
            setToasts((prev) => prev.map((t) => ({ ...t, isExiting: true })));
            setTimeout(() => setToasts([]), 260);
        };

        window.addEventListener('app:toast:push', handlePush);
        window.addEventListener('app:toast:dismiss', handleDismissEvent);
        window.addEventListener('app:toast:clear', handleClearEvent);

        return () => {
            window.removeEventListener('app:toast:push', handlePush);
            window.removeEventListener('app:toast:dismiss', handleDismissEvent);
            window.removeEventListener('app:toast:clear', handleClearEvent);
        };
    }, [handleDismiss]);

    // Automatically synchronize Laravel Inertia flash notifications
    useEffect(() => {
        const flashSignature = JSON.stringify(flash);
        if (!flash || flashSignature === lastFlashRef.current) return;
        lastFlashRef.current = flashSignature;

        if (flash.success) {
            toast.success(flash.success);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
        if (flash.warning) {
            toast.warning(flash.warning);
        }
        if (flash.info) {
            toast.info(flash.info);
        }
        if (flash.message) {
            toast.info(flash.message);
        }
    }, [flash]);

    if (toasts.length === 0) return null;

    return (
        <aside
            aria-label="Notifikasi Sistem"
            className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col gap-2.5 items-end max-w-sm sm:max-w-md w-full px-3 sm:px-0"
        >
            {toasts.map((item) => (
                <ToastItem key={item.id} toast={item} onDismiss={handleDismiss} />
            ))}
        </aside>
    );
}

