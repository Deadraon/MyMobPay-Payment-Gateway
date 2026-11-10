'use client';

import { useEffect } from 'react';

/**
 * Spinning counter (transitions-dev 26-spinning-counter).
 * Watches every .t-reel element, reads its data-value, and builds one
 * clipped vertical reel column per digit. Non-digit characters render
 * as static cells. Re-runs whenever data-value changes, so live
 * numbers (calculator outputs, dashboard stats) roll like a slot.
 */
export default function useSpinningCounter() {
  useEffect(() => {
    const reels = Array.from(document.querySelectorAll('.t-reel'));
    if (!reels.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timers = [];

    const build = (el) => {
      const value = el.getAttribute('data-value') ?? '';
      const chars = String(value).split('');
      const dur = 1100;
      const stagger = 60;
      const spinBlur = 2;
      const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

      el.textContent = '';
      chars.forEach((ch, col) => {
        if (!/\d/.test(ch)) {
          const staticCell = document.createElement('span');
          staticCell.className = 't-reel-static';
          staticCell.textContent = ch;
          el.appendChild(staticCell);
          return;
        }
        const digit = Number(ch);
        const colEl = document.createElement('span');
        colEl.className = 't-reel-col';
        const strip = document.createElement('span');
        strip.className = 't-reel-strip';
        // Strip holds 0-9 repeated: 2 full spins + the landing digit.
        const spins = 2;
        for (let i = 0; i <= spins * 10 + digit; i++) {
          const cell = document.createElement('span');
          cell.className = 't-reel-digit';
          cell.textContent = String(i % 10);
          strip.appendChild(cell);
        }
        colEl.appendChild(strip);
        el.appendChild(colEl);

        if (reduce.matches) {
          strip.style.transform = `translateY(-${(spins * 10 + digit)}em)`;
          return;
        }

        const target = spins * 10 + digit;
        // Start at 0, then tween to the landing position on the next frame.
        strip.style.transform = 'translateY(0)';
        const t = setTimeout(() => {
          strip.style.transition = `transform ${dur}ms ${ease} ${col * stagger}ms`;
          strip.style.transform = `translateY(-${target}em)`;
        }, 30);
        timers.push(t);
      });
    };

    const observer = new MutationObserver(() => {
      reels.forEach(build);
    });
    reels.forEach((el) => {
      build(el);
      observer.observe(el, { attributes: true, attributeFilter: ['data-value'] });
    });

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);
}
