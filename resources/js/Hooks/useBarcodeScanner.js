import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useBarcodeScanner: Global hardware keyboard-wedge scanner listener.
 * Detects rapid sequential keystrokes (< 50ms) ending with an Enter key.
 *
 * @param {Function} onScan - Callback when barcode is detected (barcode: string)
 * @param {Object} options - Configuration options
 * @param {number} options.maxInterval - Max milliseconds between keystrokes (default: 50ms)
 * @param {number} options.minChars - Minimum characters to consider a barcode (default: 3)
 * @param {boolean} options.ignoreInputs - Whether to ignore keypresses when an input is focused (default: false, barcode scanners usually scan regardless of focus)
 */
export function useBarcodeScanner(onScan, options = {}) {
    const {
        maxInterval = 60,
        minChars = 3,
        ignoreInputs = false,
    } = options;

    const [isScanning, setIsScanning] = useState(false);
    const [lastScannedBarcode, setLastScannedBarcode] = useState('');
    const [scannerStatus, setScannerStatus] = useState('ready'); // 'ready' | 'scanning' | 'success'

    const bufferRef = useRef([]);
    const lastKeyTimeRef = useRef(0);
    const scanTimerRef = useRef(null);
    const statusResetTimerRef = useRef(null);

    const handleKeyDown = useCallback(
        (event) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTimeRef.current;
            lastKeyTimeRef.current = currentTime;

            // If ignoreInputs is true and activeElement is an input, skip
            if (ignoreInputs) {
                const target = event.target;
                if (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable
                ) {
                    return;
                }
            }

            // Enter key signifies end of barcode transmission
            if (event.key === 'Enter') {
                if (bufferRef.current.length >= minChars) {
                    const barcode = bufferRef.current.join('').trim();
                    bufferRef.current = [];
                    setIsScanning(false);
                    setScannerStatus('success');
                    setLastScannedBarcode(barcode);

                    if (typeof onScan === 'function') {
                        onScan(barcode);
                    }

                    // Reset success status indicator after 1.5s
                    if (statusResetTimerRef.current) clearTimeout(statusResetTimerRef.current);
                    statusResetTimerRef.current = setTimeout(() => {
                        setScannerStatus('ready');
                    }, 1500);

                    // Prevent default enter behavior if it was a barcode scan
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                bufferRef.current = [];
                setIsScanning(false);
                return;
            }

            // Only capture printable ASCII characters
            if (event.key.length === 1) {
                // If the interval between characters is greater than maxInterval,
                // this is likely manual user typing, so reset buffer
                if (timeDiff > maxInterval && bufferRef.current.length > 0) {
                    bufferRef.current = [];
                    setIsScanning(false);
                }

                bufferRef.current.push(event.key);

                if (bufferRef.current.length >= 2) {
                    setIsScanning(true);
                    setScannerStatus('scanning');
                }

                // Safety timeout to reset buffer if scan is incomplete
                if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
                scanTimerRef.current = setTimeout(() => {
                    bufferRef.current = [];
                    setIsScanning(false);
                    setScannerStatus('ready');
                }, 300);
            }
        },
        [ignoreInputs, maxInterval, minChars, onScan]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
            if (statusResetTimerRef.current) clearTimeout(statusResetTimerRef.current);
        };
    }, [handleKeyDown]);

    /**
     * Helper to manually simulate a scanner event (useful for development and UI button testing)
     */
    const simulateScan = useCallback(
        (mockBarcode) => {
            setScannerStatus('scanning');
            setIsScanning(true);

            setTimeout(() => {
                setScannerStatus('success');
                setIsScanning(false);
                setLastScannedBarcode(mockBarcode);
                if (typeof onScan === 'function') {
                    onScan(mockBarcode);
                }
                setTimeout(() => setScannerStatus('ready'), 1500);
            }, 100);
        },
        [onScan]
    );

    return {
        isScanning,
        lastScannedBarcode,
        scannerStatus,
        simulateScan,
    };
}

