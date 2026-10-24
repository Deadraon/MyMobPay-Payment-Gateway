'use client';
import React, { useEffect } from 'react';
import { useModalTransition } from './useModalTransition';

/**
 * ModalDialog component conforming to transitions-dev (06-modal.md)
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} [props.overlayClassName=""]
 * @param {string} [props.className=""]
 * @param {React.ReactNode} props.children
 */
export default function ModalDialog({
  isOpen,
  onClose,
  overlayClassName = '',
  className = '',
  children,
  role = 'dialog',
  'aria-modal': ariaModal = 'true',
  ...rest
}) {
  const { isMounted, modalClass, overlayClass } = useModalTransition(isOpen);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs ${overlayClass} ${overlayClassName}`}
      onClick={onClose}
    >
      <div
        className={`${modalClass} ${className}`}
        role={role}
        aria-modal={ariaModal}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}
