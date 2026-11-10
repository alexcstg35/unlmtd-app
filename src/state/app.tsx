// App-wide state: home club, Bond profile, appearance and notification settings.
// Only the club id and settings are saved on the device; Bond keeps the account.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { bond, type Club, type Profile } from '@/bond';
import type { ThemePref } from '@/theme';

const KEY = { club: 'unlmtd.homeClub', theme: 'unlmtd.theme', notif: 'unlmtd.notif' };

export type NotifPrefs = { spots: boolean; remind: boolean; news: boolean };

type AppState = {
  ready: boolean;
  clubs: Club[];
  club: Club | null;
  setClub: (id: string | null) => void;
  user: Profile | null;
  setUser: (p: Profile | null) => void;
  themePref: ThemePref;
  setThemePref: (t: ThemePref) => void;
  notif: NotifPrefs;
  setNotif: (n: NotifPrefs) => void;
};

const Ctx = createContext<AppState | null>(null);

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
const write = (key: string, v: unknown) =>
  (v == null ? AsyncStorage.removeItem(key) : AsyncStorage.setItem(key, JSON.stringify(v))).catch(() => {});

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubId, setClubId] = useState<string | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [themePref, setThemePrefState] = useState<ThemePref>('system');
  const [notif, setNotifState] = useState<NotifPrefs>({ spots: true, remind: true, news: false });

  useEffect(() => {
    (async () => {
      const [list, id, profile, theme, n] = await Promise.all([
        bond.getClubs().catch(() => [] as Club[]),
        read<string | null>(KEY.club, null),
        bond.getProfile().catch(() => null),
        read<ThemePref>(KEY.theme, 'system'),
        read<NotifPrefs>(KEY.notif, { spots: true, remind: true, news: false }),
      ]);
      setClubs(list);
      setClubId(id && list.some((c) => c.id === id) ? id : null);
      setUser(profile);
      setThemePrefState(theme);
      setNotifState(n);
      setReady(true);
    })();
  }, []);

  const setClub = useCallback((id: string | null) => {
    setClubId(id);
    write(KEY.club, id);
  }, []);
  const setThemePref = useCallback((t: ThemePref) => {
    setThemePrefState(t);
    write(KEY.theme, t);
  }, []);
  const setNotif = useCallback((n: NotifPrefs) => {
    setNotifState(n);
    write(KEY.notif, n);
  }, []);

  const club = clubs.find((c) => c.id === clubId) ?? null;
  const value = useMemo(
    () => ({ ready, clubs, club, setClub, user, setUser, themePref, setThemePref, notif, setNotif }),
    [ready, clubs, club, setClub, user, themePref, setThemePref, notif, setNotif],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}
