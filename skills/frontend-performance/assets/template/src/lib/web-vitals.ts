import type { Metric } from 'web-vitals';
import { whenIdle } from './idle';

export interface Vital {
  name: Metric['name'];
  value: number;
  rating: Metric['rating'];
  /** Path only: no query, because it can hold personal data. */
  path: string;
}

/**
 * Measures real visits: LCP (loading), INP (reaction to clicks and typing), CLS
 * (jumping), FCP and TTFB. Does not delay the page. Call once in main.tsx.
 */
export function reportWebVitals(report: (vital: Vital) => void) {
  return whenIdle(() => {
    void import('web-vitals')
      .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        const send = ({ name, value, rating }: Metric) =>
          report({ name, value: Math.round(value * 1000) / 1000, rating, path: location.pathname });
        for (const listen of [onCLS, onFCP, onINP, onLCP, onTTFB]) listen(send);
      })
      // Measuring must never break the app.
      .catch(() => undefined);
  });
}

/** Sends even while the page is closing. */
export const sendVitalTo = (url: string) => (vital: Vital) => {
  navigator.sendBeacon(url, JSON.stringify(vital));
};
