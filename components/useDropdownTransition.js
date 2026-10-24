'use client';
import { useState, useEffect } from 'react';

/**
 * useDropdownTransition
 * Orchestrates entrance and exit states for transitions-dev Menu Dropdown (05-menu-dropdown.md)
 *
 * @param {boolean} isOpen - Whether the dropdown is open
 * @param {number} durationMs - Close animation duration in ms (default 150ms per --dropdown-close-dur)
 * @returns {{ isMounted: boolean, dropdownClass: string, isClosing: boolean }}
 */
export function useDropdownTransition(isOpen, durationMs = 150) {
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
    dropdownClass: `t-dropdown ${status === 'open' ? 'is-open' : status === 'closing' ? 'is-closing' : ''}`,
    isClosing: status === 'closing',
  };
}

export default useDropdownTransition;
