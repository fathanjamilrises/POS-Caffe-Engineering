/**
 * Web Audio API Sound Synthesizer.
 * 100% offline, zero external mp3/audio file dependencies.
 * Provides crisp tactile acoustic feedback for POS cashier and kitchen staff.
 */

let audioCtx = null;

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/**
 * 1. Barcode Scanner Beep: Crisp 880Hz cash register scanner tone
 */
export function playScannerBeep() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
        // AudioContext may be blocked before first user gesture
    }
}

/**
 * 2. Cart Add Tick: Soft pleasant 520Hz tick
 */
export function playCartBeep() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
}

/**
 * 3. Checkout / Payment Success Chime: Ascending cheerful chord (C5 -> E5 -> G5)
 */
export function playSuccessChime() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            const startTime = ctx.currentTime + index * 0.09;
            const duration = 0.18;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    } catch (e) {}
}

/**
 * 4. Kitchen Order Bell (Lonceng Dapur): Resonant physical order bell chime
 */
export function playKitchenAlertBell() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Two rings
        [0, 0.28].forEach((offset) => {
            const startTime = ctx.currentTime + offset;

            // Fundamental + harmonics
            [1200, 2400, 3600].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                const vol = idx === 0 ? 0.2 : 0.07;
                gain.gain.setValueAtTime(vol, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.25);
            });
        });
    } catch (e) {}
}

/**
 * 5. Error / Underpayment Warning Buzzer: Low warning tone
 */
export function playWarningBuzzer() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
}
