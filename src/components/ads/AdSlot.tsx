'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT } from '@/lib/site';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  /** AdSense ad unit ID (NEXT_PUBLIC_ADSENSE_SLOT_*). Without it (or without the client ID) the slot is not active. */
  slot: string | undefined;
  /** `top`: full-width banner area. `sidebar`: rectangle under the filters, kept well apart from the controls. */
  variant: 'top' | 'sidebar';
}

/**
 * One responsive AdSense display unit with an "Advertisement" label.
 *
 * Not configured: a gray placeholder in development, nothing at all in production.
 * Unfilled units collapse completely (label included) via the `:has()` rule in globals.css.
 * Layout and spacing live in globals.css (`.ad-slot*`).
 */
export default function AdSlot({ slot, variant }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const active = Boolean(ADSENSE_CLIENT && slot);

  useEffect(() => {
    // Refs survive React's strict-mode effect replay, and AdSense marks a filled/pending
    // element itself; either guard stops a second push, which would throw
    // "All 'ins' elements ... already have ads in them".
    if (!active || pushed.current) return;
    const ins = insRef.current;
    if (!ins || ins.dataset.adsbygoogleStatus) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn('AdSense: could not request an ad', error);
    }
  }, [active]);

  if (!active) {
    if (process.env.NODE_ENV === 'production') return null;
    return (
      <aside className={`ad-slot ad-slot--${variant}`} aria-label="Advertisement placeholder">
        <div className="ad-slot__label">Advertisement</div>
        <div className="ad-slot__placeholder">Ad slot ({variant}): set NEXT_PUBLIC_ADSENSE_* to enable</div>
      </aside>
    );
  }

  return (
    <aside className={`ad-slot ad-slot--${variant}`} aria-label="Advertisement">
      <div className="ad-slot__label">Advertisement</div>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
