'use client';
import React from 'react';
import { useDropdownTransition } from './useDropdownTransition';

/**
 * DropdownMenu component compliant with transitions-dev (05-menu-dropdown.md)
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls visibility
 * @param {'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right'} [props.origin="top-right"] - Origin for scale transform
 * @param {string} [props.className=""] - Additional class names
 * @param {React.ReactNode} props.children
 */
export default function DropdownMenu({
  isOpen,
  origin = 'top-right',
  className = '',
  children,
  ...rest
}) {
  const { isMounted, dropdownClass } = useDropdownTransition(isOpen);

  if (!isMounted) return null;

  return (
    <div
      className={`${dropdownClass} ${className}`}
      data-origin={origin}
      {...rest}
    >
      {children}
    </div>
  );
}
