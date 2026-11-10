import type { Club } from '@/bond';

export function fmtTime(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${hh % 12 === 0 ? 12 : hh % 12}:${String(mm).padStart(2, '0')}${hh < 12 ? 'am' : 'pm'}`;
}

const DEFAULT_HOURS = { weekday: [9, 24] as [number, number], weekend: [8, 24] as [number, number] };

export function hoursFor(c: Club, d: Date) {
  const h = c.hours ?? DEFAULT_HOURS;
  return d.getDay() === 0 || d.getDay() === 6 ? h.weekend : h.weekday;
}

/** The line above the club name on Home, e.g. "Open now until 12:00am". */
export function openStatus(c: Club): { text: string; live: boolean; pill?: boolean } {
  if (c.openingSoon) return { text: 'Opening soon', live: false, pill: true };
  if (!c.hours) return { text: 'Open 365 days a year', live: false };
  const n = new Date();
  const now = n.getHours() + n.getMinutes() / 60;
  const [o, cl] = hoursFor(c, n);
  if (now >= o && now < cl) return { text: `Open now until ${fmtTime(cl)}`, live: true };
  if (now < o) return { text: `Opens today at ${fmtTime(o)}`, live: false };
  return { text: 'Closed for tonight', live: false };
}

export function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const fmtDist = (d: number) => (d < 10 ? `${d.toFixed(1)} mi` : `${Math.round(d).toLocaleString('en-US')} mi`);

export const directionsUrl = (c: Club) =>
  c.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('UNLMTD Soccer ' + c.name)}`;

export const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '');

// Money and dates. Written by hand so they look the same on every phone.
export function money(n: number, currency: 'USD' | 'CAD' = 'USD') {
  const s = Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${n < 0 ? '-' : ''}${currency === 'CAD' ? 'CA$' : '$'}${s}`;
}
export const money0 = (n: number, currency: 'USD' | 'CAD' = 'USD') => money(n, currency).replace(/\.00$/, '');

const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const weekdayShort = (d: Date) => DAY[d.getDay()].slice(0, 3);
export const weekdayLong = (d: Date) => DAY[d.getDay()];
export const monthShort = (d: Date) => MONTH[d.getMonth()].slice(0, 3);
export const fmtDay = (d: Date) => `${weekdayShort(d)}, ${monthShort(d)} ${d.getDate()}`;
export const fmtDayLong = (d: Date) => `${weekdayLong(d)}, ${MONTH[d.getMonth()]} ${d.getDate()}`;
export const fmtMD = (d: Date) => `${monthShort(d)} ${d.getDate()}`;

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export function nextDays(n = 14) {
  const t = new Date();
  return Array.from({ length: n }, (_, i) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + i));
}

const TZ_LABEL: Record<string, string> = {
  'America/New_York': 'Eastern', 'America/Toronto': 'Eastern', 'America/Indiana/Indianapolis': 'Eastern',
  'America/Chicago': 'Central', 'America/Denver': 'Mountain', 'America/Los_Angeles': 'Pacific',
};
export const tzLabel = (c: Club) => TZ_LABEL[c.timezone] ?? 'local';

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
