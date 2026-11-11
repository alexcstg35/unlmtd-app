// What the person has picked on the Book tab, shared with the checkout screen.
// Mirrors the prototype's `S` selection fields and its `sel()` summary.
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { bookingUrl, openBondPage, WEB_MODE, type Camp, type Club, type PickupSession, type RentalService, type WaiverId } from '@/bond';
import { ACTIVITIES, type ActivityId } from '@/lib/activities';
import { fmtDay, fmtDayLong, fmtTime, money0, nextDays, parseIso, plural, iso } from '@/lib/format';
import type { ActivityColor } from '@/theme/colors';

import { useApp } from './app';

export const DURATIONS = [
  { label: '1 hr', h: 1 },
  { label: '1.5 hr', h: 1.5 },
  { label: '2 hr', h: 2 },
];
export const APPROVAL_FROM = 22;

export type PickedSlot = { start: number; field: string; price: number; needsApproval: boolean };

type Picks = {
  act: ActivityId;
  service: RentalService | null;
  day: number;
  dur: number;
  slots: PickedSlot[];
  programId: string;
  session: PickupSession | null;
  camp: Camp | null;
  campDays: string[];
};

const EMPTY: Omit<Picks, 'act' | 'programId'> = { service: null, day: 0, dur: 0, slots: [], session: null, camp: null, campDays: [] };

export type Selection = {
  kind: 'rental' | 'pickup' | 'camp';
  color: ActivityColor;
  actName: string;
  title: string;
  when: string;
  short: string;
  detail: string;
  date: string;
  start: number;
  needsApproval: boolean;
  waiverId: WaiverId;
  waiverName: string;
  /** Rental: the summed slot prices. Pickup: per player. Camp: per camper for all chosen days. */
  price: number;
  /** Most people that can be registered (spots left). */
  max: number;
  minAge?: number;
  maxAge?: number;
  rental?: { service: RentalService; date: string; duration: number; slots: PickedSlot[] };
  pickup?: { session: PickupSession };
  camp?: { camp: Camp; days: string[] };
};

type BookingCtx = Picks & {
  days: Date[];
  set: (p: Partial<Picks>) => void;
  startActivity: (act: ActivityId) => void;
  reset: () => void;
  selection: Selection | null;
};

const Ctx = createContext<BookingCtx | null>(null);

function summarize(p: Picks, club: Club | null, days: Date[]): Selection | null {
  if (!club) return null;
  const act = ACTIVITIES.find((a) => a.id === p.act)!;
  const base = { color: act.color, actName: act.name };

  if (p.act === 'rent-a-field') {
    if (!p.service || !p.slots.length) return null;
    const d = days[p.day];
    const dur = DURATIONS[p.dur];
    const slots = [...p.slots].sort((x, y) => x.start - y.start || x.field.localeCompare(y.field));
    const one = slots.length === 1;
    return {
      ...base,
      kind: 'rental',
      title: p.service.name,
      when: one ? `${fmtDayLong(d)}, ${fmtTime(slots[0].start)}–${fmtTime(slots[0].start + dur.h)}` : `${fmtDayLong(d)}, ${slots.length} slots`,
      short: one ? `${fmtDay(d)} at ${fmtTime(slots[0].start)}, ${slots[0].field}` : `${fmtDay(d)}, ${slots.length} slots`,
      detail: slots.map((s) => `${s.field}, ${fmtTime(s.start)}–${fmtTime(s.start + dur.h)}`).join('; '),
      date: iso(d),
      start: slots[0].start,
      needsApproval: slots.some((s) => s.needsApproval),
      waiverId: 'adult',
      waiverName: 'UNLMTD Soccer waiver, adult',
      price: slots.reduce((t, s) => t + s.price, 0),
      max: 1,
      rental: { service: p.service, date: iso(d), duration: dur.h, slots },
    };
  }

  if (p.act === 'pickup-soccer') {
    const s = p.session;
    if (!s) return null;
    const d = parseIso(s.date);
    return {
      ...base,
      kind: 'pickup',
      title: s.name,
      when: `${fmtDayLong(d)}, ${fmtTime(s.start)}–${fmtTime(s.start + s.length)}`,
      short: `${fmtDay(d)}, ${fmtTime(s.start)}`,
      detail: `1 pick-up session, ${money0(s.price, club.currency)} per player`,
      date: s.date,
      start: s.start,
      needsApproval: false,
      waiverId: 'pickup',
      waiverName: 'UNLMTD Soccer waiver, adult pickup and open play',
      price: s.price,
      max: Math.min(6, s.spotsLeft),
      minAge: 16,
      pickup: { session: s },
    };
  }

  const k = p.camp;
  if (!k || !p.campDays.length) return null;
  const chosen = [...p.campDays].sort();
  return {
    ...base,
    kind: 'camp',
    title: k.title,
    when: `${chosen.map((x) => fmtDay(parseIso(x))).join(', ')}, ${k.hours}`,
    short: `${plural(chosen.length, 'day')} from ${fmtDay(parseIso(chosen[0]))}`,
    detail: `${plural(chosen.length, 'day')} at ${money0(k.pricePerDay, club.currency)}, ages ${k.ages[0]} to ${k.ages[1]}`,
    date: chosen[0],
    start: 9,
    needsApproval: false,
    waiverId: 'youth',
    waiverName: 'UNLMTD Soccer waiver, youth programs',
    price: k.pricePerDay * chosen.length,
    max: k.spotsLeft,
    minAge: k.ages[0],
    maxAge: k.ages[1],
    camp: { camp: k, days: chosen },
  };
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const { club } = useApp();
  const [picks, setPicks] = useState<Picks>({ act: 'rent-a-field', programId: 'pickup', ...EMPTY });
  const [days, setDays] = useState(() => nextDays(14));

  const set = useCallback((p: Partial<Picks>) => setPicks((cur) => ({ ...cur, ...p })), []);
  const reset = useCallback(() => {
    setDays(nextDays(14));
    setPicks((cur) => ({ ...cur, ...EMPTY }));
  }, []);
  const startActivity = useCallback((act: ActivityId) => {
    setDays(nextDays(14));
    setPicks((cur) => ({ ...cur, ...EMPTY, act }));
  }, []);

  // A new club means new fields, sessions and camps.
  useEffect(reset, [club?.id, reset]);

  const selection = useMemo(() => summarize(picks, club, days), [picks, club, days]);
  const value = useMemo(() => ({ ...picks, days, set, startActivity, reset, selection }), [picks, days, set, startActivity, reset, selection]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBooking() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBooking must be used inside BookingProvider');
  return v;
}

/** Home tiles and buttons: open the Book tab on an activity with a fresh selection. */
export function useStartBooking() {
  const { startActivity } = useBooking();
  const { club } = useApp();
  return useCallback(
    (act: ActivityId) => {
      // Website mode: go straight to the club's Bond booking page.
      if (WEB_MODE && club) return void openBondPage(bookingUrl(club, act));
      startActivity(act);
      router.navigate('/book');
    },
    [startActivity, club],
  );
}
