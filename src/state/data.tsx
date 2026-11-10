// Signed-in data from Bond: bookings, household, waivers on file and saved cards.
// Loaded when someone signs in; call refresh() after anything changes them.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { bond, WAIVER_IDS, type Booking, type Member, type SavedCard } from '@/bond';
import { iso } from '@/lib/format';

import { useApp } from './app';

type Data = {
  loading: boolean;
  bookings: Booking[];
  upcoming: Booking[];
  past: Booking[];
  household: Member[];
  /** How many waivers each member has on file. */
  waiverCount: Record<string, number>;
  cards: SavedCard[];
  refresh: () => Promise<void>;
};

const Ctx = createContext<Data | null>(null);
const sortKey = (b: Booking) => `${b.date}${String(b.start).padStart(5, '0')}`;

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [household, setHousehold] = useState<Member[]>([]);
  const [waiverCount, setWaiverCount] = useState<Record<string, number>>({});
  const [cards, setCards] = useState<SavedCard[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setHousehold([]);
      setWaiverCount({});
      setCards([]);
      return;
    }
    setLoading(true);
    try {
      const [b, h, k] = await Promise.all([bond.getBookings(), bond.getHousehold(), bond.getSavedCards()]);
      const counts = await Promise.all(h.map(async (m) => (await Promise.all(WAIVER_IDS.map((w) => bond.getWaiverStatus(m, w)))).filter((s) => s.signed).length));
      setBookings(b);
      setHousehold(h);
      setCards(k);
      setWaiverCount(Object.fromEntries(h.map((m, i) => [m.id, counts[i]])));
    } catch {
      // Keep what we had; the next refresh tries again.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => {
    const today = iso(new Date());
    const upcoming = bookings.filter((b) => b.date >= today).sort((x, y) => sortKey(x).localeCompare(sortKey(y)));
    const past = bookings.filter((b) => b.date < today).sort((x, y) => sortKey(y).localeCompare(sortKey(x)));
    return { loading, bookings, upcoming, past, household, waiverCount, cards, refresh };
  }, [loading, bookings, household, waiverCount, cards, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be used inside DataProvider');
  return v;
}
