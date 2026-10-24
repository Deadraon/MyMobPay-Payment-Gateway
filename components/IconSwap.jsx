'use client';

import React from 'react';

/**
 * Transitions.dev: Icon Swap (09-icon-swap.md)
 * Cross-fades two icons in the same slot without layout pop.
 *
 * @param {boolean|string} active - If boolean: false -> 'a', true -> 'b'. Or string 'a' | 'b'.
 * @param {React.ReactNode} iconA - Default / idle icon (state 'a')
 * @param {React.ReactNode} iconB - Active / alternate icon (state 'b')
 * @param {string} className - Optional container classes
 */
export default function IconSwap({ active, iconA, iconB, className = '' }) {
  const state = typeof active === 'boolean' ? (active ? 'b' : 'a') : active;

  return (
    <span className={`t-icon-swap ${className}`} data-state={state}>
      <span className="t-icon" data-icon="a" aria-hidden={state !== 'a'}>
        {iconA}
      </span>
      <span className="t-icon" data-icon="b" aria-hidden={state !== 'b'}>
        {iconB}
      </span>
    </span>
  );
}
