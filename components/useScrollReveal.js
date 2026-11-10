'use client';

import { useEffect } from 'react';

/**
 * Scroll-reveal orchestrator.
 * Watches every [data-reveal] element and [data-reveal-stagger] group
 * and adds .is-shown the first time it enters the viewport.
 * Pure CSS handles the motion (globals.css .t-reveal block).
 */
export default function useScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-shown');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
