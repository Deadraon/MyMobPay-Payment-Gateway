'use client';

import { useEffect } from 'react';

/**
 * Tabs sliding pill (transitions-dev 16-tabs-sliding).
 * Watches every .t-tabs bar, writes the active tab's offsetLeft /
 * offsetWidth / offsetHeight / offsetTop onto the .t-tabs-pill so it
 * glides between options. Re-measures on resize. Active state is read
 * from aria-selected, so React state stays the source of truth.
 */
export default function useTabsPill() {
  useEffect(() => {
    const bars = Array.from(document.querySelectorAll('.t-tabs'));
    if (!bars.length) return;

    const cleanups = [];

    bars.forEach((bar) => {
      const pill = bar.querySelector('.t-tabs-pill');
      if (!pill) return;
      const tabs = Array.from(bar.querySelectorAll('.t-tab'));
      if (!tabs.length) return;

      const moveTo = (tab, animate) => {
        if (!tab) return;
        if (!animate) {
          const prev = pill.style.transition;
          pill.style.transition = 'none';
          pill.style.transform = `translateX(${tab.offsetLeft}px)`;
          pill.style.top = `${tab.offsetTop}px`;
          pill.style.width = `${tab.offsetWidth}px`;
          pill.style.height = `${tab.offsetHeight}px`;
          void pill.offsetWidth;
          pill.style.transition = prev;
        } else {
          pill.style.transform = `translateX(${tab.offsetLeft}px)`;
          pill.style.top = `${tab.offsetTop}px`;
          pill.style.width = `${tab.offsetWidth}px`;
          pill.style.height = `${tab.offsetHeight}px`;
        }
      };

      const active = () =>
        tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];

      const sync = () => moveTo(active(), true);

      // First paint: snap without a transition.
      const raf = requestAnimationFrame(() => moveTo(active(), false));
      window.addEventListener('resize', sync);

      // React re-renders swap aria-selected; watch for it.
      const mo = new MutationObserver(sync);
      mo.observe(bar, { attributes: true, subtree: true, attributeFilter: ['aria-selected'] });

      cleanups.push(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', sync);
        mo.disconnect();
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);
}
