import { useSyncExternalStore } from 'react';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "just now", "5 minutes ago", "yesterday", "2 days ago", ... Returns '' for unknown times. */
export function formatRelativeTime(timestamp: number | undefined, now: number): string {
  if (!timestamp || !now) return '';
  const diff = Math.max(0, now - timestamp);
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return formatter.format(-Math.floor(diff / MINUTE), 'minute');
  if (diff < DAY) return formatter.format(-Math.floor(diff / HOUR), 'hour');
  if (diff < WEEK) return formatter.format(-Math.floor(diff / DAY), 'day');
  if (diff < MONTH) return formatter.format(-Math.floor(diff / WEEK), 'week');
  if (diff < YEAR) return formatter.format(-Math.floor(diff / MONTH), 'month');
  return formatter.format(-Math.floor(diff / YEAR), 'year');
}

// A shared clock that ticks once a minute while something is subscribed.
// Kept outside render so components stay pure; 0 on the server / before mount.
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, MINUTE);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now, () => 0);
}
