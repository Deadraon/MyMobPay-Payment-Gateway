'use client';

import { useEffect } from 'react';

/**
 * Card hover tilt (transitions-dev 19-card-tilt).
 * Watches every .t-tilt wrapper (which never transforms) and drives
 * the inner .t-tilt-card's rotateX/rotateY plus the cursor-tracked
 * glare position. Pointer-only; flattens under reduced motion.
 */
export default function useTiltCards() {
  useEffect(() => {
    const wrappers = document.querySelectorAll('.t-tilt');
    if (!wrappers.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const MAX = 8; // subtle, professional lean in degrees

    const cleanups = [];

    wrappers.forEach((tilt) => {
      const card = tilt.querySelector('.t-tilt-card');
      if (!card) return;

      const reset = () => {
        tilt.classList.remove('is-hover');
        card.classList.remove('is-tilting');
        card.style.setProperty('--tilt-rx', '0deg');
        card.style.setProperty('--tilt-ry', '0deg');
      };

      const track = (e) => {
        if (reduce.matches) return;
        const r = tilt.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        tilt.classList.add('is-hover');
        card.classList.add('is-tilting');
        card.style.setProperty('--tilt-ry', ((px - 0.5) * MAX).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-rx', ((0.5 - py) * MAX).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--tilt-gy', (py * 100).toFixed(1) + '%');
      };

      const onDown = (e) => {
        if (e.pointerType !== 'mouse') {
          try { tilt.setPointerCapture(e.pointerId); } catch (_) {}
        }
      };
      const onLeave = (e) => {
        if (e.pointerType === 'mouse') reset();
      };

      tilt.addEventListener('pointerdown', onDown);
      tilt.addEventListener('pointermove', track);
      tilt.addEventListener('pointerup', reset);
      tilt.addEventListener('pointercancel', reset);
      tilt.addEventListener('pointerleave', onLeave);

      cleanups.push(() => {
        tilt.removeEventListener('pointerdown', onDown);
        tilt.removeEventListener('pointermove', track);
        tilt.removeEventListener('pointerup', reset);
        tilt.removeEventListener('pointercancel', reset);
        tilt.removeEventListener('pointerleave', onLeave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);
}
