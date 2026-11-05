/**
 * Universal Toast & Push Alert Service
 * Executive Obsidian Ultramarine notification engine.
 * Emits lightweight CustomEvents for the reactive ToastContainer.
 */

let counter = 0;

export const toast = {
    /**
     * Dispatch a notification toast
     * @param {string|object} messageOrConfig
     * @param {object} [options]
     * @returns {string} id
     */
    show(messageOrConfig, options = {}) {
        if (typeof window === 'undefined') return '';

        let payload;
        if (typeof messageOrConfig === 'string') {
            payload = {
                id: options.id || `toast-${Date.now()}-${++counter}`,
                type: options.type || 'info',
                title: options.title || null,
                message: messageOrConfig,
                duration: options.duration !== undefined ? options.duration : 4200,
                action: options.action || null,
                createdAt: Date.now(),
            };
        } else if (typeof messageOrConfig === 'object' && messageOrConfig !== null) {
            payload = {
                id: messageOrConfig.id || `toast-${Date.now()}-${++counter}`,
                type: messageOrConfig.type || 'info',
                title: messageOrConfig.title || null,
                message: messageOrConfig.message || '',
                duration: messageOrConfig.duration !== undefined ? messageOrConfig.duration : 4200,
                action: messageOrConfig.action || null,
                createdAt: Date.now(),
                ...messageOrConfig,
            };
        } else {
            return '';
        }

        window.dispatchEvent(
            new CustomEvent('app:toast:push', {
                detail: payload,
            })
        );

        return payload.id;
    },

    /**
     * Success Alert (Emerald)
     */
    success(message, options = {}) {
        return this.show(message, {
            type: 'success',
            title: options.title || 'Berhasil',
            duration: options.duration || 4000,
            ...options,
        });
    },

    /**
     * Error Alert (Rose)
     */
    error(message, options = {}) {
        return this.show(message, {
            type: 'error',
            title: options.title || 'Terjadi Kendala',
            duration: options.duration || 5200,
            ...options,
        });
    },

    /**
     * Warning Alert (Amber)
     */
    warning(message, options = {}) {
        return this.show(message, {
            type: 'warning',
            title: options.title || 'Peringatan',
            duration: options.duration || 4800,
            ...options,
        });
    },

    /**
     * Informational Alert (Indigo / Cobalt)
     */
    info(message, options = {}) {
        return this.show(message, {
            type: 'info',
            title: options.title || 'Informasi',
            duration: options.duration || 4200,
            ...options,
        });
    },

    /**
     * Dismiss a specific notification by ID
     */
    dismiss(id) {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(
            new CustomEvent('app:toast:dismiss', {
                detail: { id },
            })
        );
    },

    /**
     * Dismiss all active notifications
     */
    clear() {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('app:toast:clear'));
    },
};

// Global browser window attachment for debugging & direct access
if (typeof window !== 'undefined') {
    window.toast = toast;
}

export default toast;

