'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * ThemeToggleButton
 * Animated Single Theme Toggle Button (Light ↔ Dark)
 * Built with Transitions.dev 09-icon-swap (rotation, scale, cross-blur)
 * and 04-text-states-swap (vertical slide + cross-blur).
 *
 * @param {'light'|'dark'} theme - Current active theme
 * @param {() => void} onToggle - Callback triggered to toggle theme
 * @param {boolean} showLabel - Whether to render the animated "Light" / "Dark" text
 * @param {string} className - Optional container styling
 */
export default function ThemeToggleButton({
  theme = 'light',
  onToggle,
  showLabel = true,
  className = '',
}) {
  const isDark = theme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      data-theme={theme}
      className={`theme-toggle-single ${!showLabel ? 'icon-only' : ''} ${className}`}
      title={`Switch to ${nextTheme} theme`}
      aria-label={`Switch to ${nextTheme} theme`}
      aria-pressed={isDark}
    >
      <span className="theme-toggle-icon-box" aria-hidden="true">
        <Sun className="theme-toggle-icon theme-toggle-sun w-3.5 h-3.5" />
        <Moon className="theme-toggle-icon theme-toggle-moon w-3.5 h-3.5" />
      </span>
      {showLabel && (
        <span className="theme-toggle-label-box" aria-hidden="true">
          <span className="theme-toggle-label theme-toggle-label-light">Light</span>
          <span className="theme-toggle-label theme-toggle-label-dark">Dark</span>
        </span>
      )}
    </button>
  );
}
