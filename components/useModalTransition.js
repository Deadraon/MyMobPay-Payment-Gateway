'use client';
import { useState, useEffect } from 'react';

/**
 * useModalTransition
 * Orchestrates entrance and exit states for transitions-dev Modal (06-modal.md)
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {number} durationMs - Close animation duration in ms (default 150ms per --modal-close-dur)
 * @returns {{ isMounted: boolean, modalClass: string, overlayClass: string, isClosing: boolean }}
 */
export function useModalTransition(isOpen, durationMs = 150) {
  const [mounted, setMounted] = useState(isOpen);
  const [status, setStatus] = useState(isOpen ? 'open' : 'closed');

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setMounted(true);
      const raf = requestAnimationFrame(() => {
        setStatus('open');
      });
      return () => cancelAnimationFrame(raf);
    } else if (mounted) {
      setStatus('closing');
      timeoutId = setTimeout(() => {
        setMounted(false);
        setStatus('closed');
      }, durationMs);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen, mounted, durationMs]);

  return {
    isMounted: mounted,
    modalClass: `t-modal ${status === 'open' ? 'is-open' : status === 'closing' ? 'is-closing' : ''}`,
    overlayClass: `t-modal-overlay ${status === 'open' ? 'is-open' : status === 'closing' ? 'is-closing' : ''}`,
    isClosing: status === 'closing',
  };
}

export default useModalTransition;
