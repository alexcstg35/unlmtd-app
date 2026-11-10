// Sample data copied from prototype.html. Stands in for Bond until API access arrives.
// Nothing here talks to a server, and no password is ever stored.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  BondApi,
  Booking,
  Camp,
  CampAddon,
  Cart,
  CartItem,
  Club,
  Member,
  PickupProgram,
  PickupSession,
  Profile,
  RentalExtra,
  RentalService,
  SavedCard,
  Slot,
  WaiverId,
} from './types';

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const page = (id: string) => `https://unlmtdsoccer.com/en/clubs/${id}`;

type Raw = Omit<Club, 'country' | 'currency' | 'pageUrl' | 'timezone'> & { ca?: boolean; rates?: Record<string, { off: number; prime: number }> };

const RAW: Raw[] = [
  { id: 'wall-street', name: 'Wall Street', city: 'Manhattan, NY', region: 'New York', lat: 40.706, lng: -74.0086 },
  { id: 'sunset-park', name: 'Sunset Park', city: 'Brooklyn, NY', region: 'New York', lat: 40.6455, lng: -74.0124 },
  { id: 'crown-heights', name: 'Crown Heights', city: 'Brooklyn, NY', region: 'New York', lat: 40.6694, lng: -73.9422 },
  { id: 'long-island-city', name: 'Long Island City', city: 'Queens, NY', region: 'New York', formats: ['5v5', '8v8'], lat: 40.7447, lng: -73.9485 },
  { id: 'new-rochelle', name: 'New Rochelle', city: 'New Rochelle, NY', region: 'New York', lat: 40.9115, lng: -73.7824 },
  { id: 'south-boston', name: 'South Boston', city: 'Boston, MA', region: 'Boston', address: '4 Alger St, Boston, MA', phone: '(774) 404-0425', rates: { '5v5': { off: 150, prime: 220 }, '7v7': { off: 250, prime: 400 } }, lat: 42.3297, lng: -71.0575 },
  { id: 'malden', name: 'Malden', city: 'Malden, MA', region: 'Boston', lat: 42.4251, lng: -71.0662 },
  { id: 'new-haven', name: 'New Haven', city: 'New Haven, CT', region: 'Connecticut', lat: 41.3083, lng: -72.9279 },
  { id: 'hochelaga', name: 'Hochelaga', city: 'Montréal, QC', region: 'Montréal', ca: true, lat: 45.5466, lng: -73.5401 },
  { id: 'plateau', name: 'Le Plateau', city: 'Montréal, QC', region: 'Montréal', ca: true, lat: 45.5225, lng: -73.5795 },
  { id: 'lasalle', name: 'LaSalle', city: 'Montréal, QC', region: 'Montréal', ca: true, lat: 45.4318, lng: -73.6289 },
  { id: 'toronto-etobicoke', name: 'Toronto', city: 'Etobicoke, ON', region: 'Toronto', ca: true, lat: 43.6205, lng: -79.5132 },
  { id: 'cincinnati', name: 'Cincinnati', city: 'Cincinnati, OH', region: 'Cincinnati', lat: 39.1031, lng: -84.512 },
  { id: 'indianapolis', name: 'Indianapolis', city: 'Indianapolis, IN', region: 'Indianapolis', lat: 39.7684, lng: -86.1581 },
  { id: 'west-la', name: 'West LA', city: 'Los Angeles, CA', region: 'Los Angeles', address: '11674 Santa Monica Blvd, Los Angeles, CA', email: 'westla@unlmtdsoccer.com', hours: { weekday: [10, 24], weekend: [8, 24] }, formats: ['5v5', '7v7', '8v8'], outdoor: true, rates: { '5v5': { off: 190, prime: 195 } }, openingSoon: true, lat: 34.0445, lng: -118.4557 },
  { id: 'huntington-park', name: 'Huntington Park', city: 'Huntington Park, CA', region: 'Los Angeles', address: '5820 Bickett St, Huntington Park, CA', rates: { '5v5': { off: 160, prime: 160 } }, openingSoon: true, lat: 33.9895, lng: -118.2198 },
  { id: 'austin', name: 'Austin', city: 'Austin, TX', region: 'Texas', address: '10601 N Lamar Blvd, Austin, TX', openingSoon: true, lat: 30.383, lng: -97.693 },
  { id: 'san-antonio', name: 'San Antonio', city: 'San Antonio, TX', region: 'Texas', address: '6558 Campus Dr, San Antonio, TX', openingSoon: true, lat: 29.517, lng: -98.398 },
];


const TZ: Record<string, string> = {
  'New York': 'America/New_York', Boston: 'America/New_York', Connecticut: 'America/New_York', Montréal: 'America/Toronto',
  Toronto: 'America/Toronto', Cincinnati: 'America/New_York', Indianapolis: 'America/Indiana/Indianapolis',
  'Los Angeles': 'America/Los_Angeles', Texas: 'America/Chicago',
};

const CLUBS: Club[] = RAW.map(({ ca, rates: _r, ...c }) => ({
  ...c,
  timezone: TZ[c.region] ?? 'America/New_York',
  country: ca ? 'CA' : 'US',
  currency: ca ? 'CAD' : 'USD',
  pageUrl: page(c.id),
}));

// Field rental
const RATES: Record<string, { off: number; prime: number }> = { '5v5': { off: 150, prime: 180 }, '7v7': { off: 250, prime: 300 }, '8v8': { off: 270, prime: 320 } };
const FIELDS: Record<string, number> = { '5v5': 3, '7v7': 1, '8v8': 1 };
const DEFAULT_HOURS = { weekday: [9, 24], weekend: [8, 24] } as const;
const APPROVAL_FROM = 22;
const ratesOf = (club: Club, f: string) => RAW.find((r) => r.id === club.id)?.rates?.[f] ?? RATES[f] ?? RATES['5v5'];
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const isPeak = (d: Date, h: number) => isWeekend(d) || h >= 17;

// Pickup
const PICKUP_PRICE = 10;
const PICKUP_RULES = [
  'One game leader per session, up to 3 teams on rotation so everyone plays.',
  'Call your own fouls. No slide tackling.',
  'If not enough players sign up, the session is cancelled 1 hour before and everyone is refunded.',
  'No-shows are temporarily banned, so please cancel through the club if you can’t make it.',
];
const PICKUP: (PickupProgram & { slots: { dow: number[]; h: number; len: number; cap: number }[] })[] = [
  { id: 'pickup', name: 'Pick-Up', ages: '16 to 70', minAge: 16, rules: PICKUP_RULES, price: PICKUP_PRICE, blurb: '$10 pick-up sessions every Monday, Wednesday and Friday, 6:00–8:00pm.', slots: [{ dow: [1, 3, 5], h: 18, len: 2, cap: 24 }, { dow: [3], h: 20, len: 2, cap: 24 }] },
  { id: 'women', name: 'Women’s Pick-Up', ages: '16 to 70', minAge: 16, rules: PICKUP_RULES, price: PICKUP_PRICE, blurb: 'Women’s pick-up sessions, all levels.', slots: [{ dow: [2], h: 19, len: 2, cap: 20 }] },
];

// Camps
const CAMPS_US: [string, string, string, string][] = [
  ['vet', 'Veterans Day Camp', '2026-11-11', '2026-11-11'], ['thx', 'Thanksgiving Camp', '2026-11-26', '2026-11-27'],
  ['xmas', 'Christmas Camp', '2026-12-24', '2026-12-24'], ['ny', 'New Year Camp', '2026-12-28', '2026-12-31'],
  ['teach', 'Teacher Reporting Day Camp', '2027-01-04', '2027-01-04'], ['mlk', 'MLK Day Camp', '2027-01-18', '2027-01-18'],
  ['feb', 'February Recess Camp', '2027-02-15', '2027-02-19'], ['gf', 'Good Friday Camp', '2027-03-26', '2027-03-26'],
  ['apr', 'April Recess Camp', '2027-04-19', '2027-04-23'], ['mem', 'Memorial Day Camp', '2027-05-31', '2027-05-31'],
  ['june', 'Juneteenth Camp', '2027-06-18', '2027-06-18'],
];
const CAMPS_CA: [string, string, string, string][] = [['win', 'Winter Break Camp', '2026-12-28', '2026-12-31'], ['march', 'March Break Camp', '2027-03-08', '2027-03-12']];
const RENT_EXTRAS: RentalExtra[] = [{ id: 'ball', name: 'Soccer ball rental', price: 5 }];
const ADDONS: CampAddon[] = [
  { id: 'early', name: 'Early drop-off', detail: '8:00–8:30am', pricePerDay: 15 },
  { id: 'lunch', name: 'Lunch', detail: '10am snack, soft drink and lunch', pricePerDay: 25 },
  { id: 'late', name: 'Late pickup', detail: '3:00–5:00pm', pricePerDay: 30 },
];

const WAIVER_TEXT =
  'IMPORTANT: READ BEFORE SIGNING. This Waiver of Liability, Indemnity Agreement, Release, and Assumption of Risk applies to participation in soccer and related activities at UNLMTD Soccer. Prototype placeholder: the app shows the exact waiver text from Bond, and the person has to scroll through it before they can agree.';

// Seeded random, so sample availability stays the same between renders.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const today = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};
const nowH = () => {
  const n = new Date();
  return n.getHours() + n.getMinutes() / 60;
};
const uid = () => Math.random().toString(36).slice(2, 9);

// Signed-in profile and household, kept on the device for the mock only.
const K = { profile: 'unlmtd.mock.profile', household: 'unlmtd.mock.household', bookings: 'unlmtd.mock.bookings', waivers: 'unlmtd.mock.waivers', cards: 'unlmtd.mock.cards' };
const SAMPLE_CARDS: SavedCard[] = [{ id: 'card-1', brand: 'Visa', last4: '4242', exp: '12/30' }];

// Carts waiting for checkout, kept in memory for the mock.
type BookingInfo = Parameters<BondApi['buildCart']>[1];
const carts = new Map<string, { cart: Cart; info: BookingInfo }>();
async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
const save = (key: string, v: unknown) => AsyncStorage.setItem(key, JSON.stringify(v)).catch(() => {});
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '');

async function currentProfile() {
  return load<Profile | null>(K.profile, null);
}
async function household(): Promise<Member[]> {
  const p = await currentProfile();
  if (!p) return [];
  const kids = await load<Member[]>(`${K.household}.${p.email}`, []);
  const me: Member = { id: 'self', firstName: p.firstName, lastName: p.lastName, birthYear: new Date().getFullYear() - 30, isAccountHolder: true };
  return [me, ...kids];
}

export const mock: BondApi = {
  async signIn(email) {
    await delay(800);
    const parts = email.split('@')[0].split(/[._-]+/);
    const known = await load<Profile | null>(`${K.profile}.${email.toLowerCase()}`, null);
    const profile: Profile = known ?? { id: uid(), email, firstName: cap(parts[0]) || 'Player', lastName: cap(parts[1] ?? '') };
    await save(K.profile, profile);
    return profile;
  },
  async signUp({ firstName, lastName, email }) {
    await delay(800);
    const profile: Profile = { id: uid(), email, firstName, lastName };
    await save(K.profile, profile);
    await save(`${K.profile}.${email.toLowerCase()}`, profile);
    return profile;
  },
  async signOut() {
    await AsyncStorage.removeItem(K.profile);
  },
  getProfile: currentProfile,
  async requestPasswordReset() {
    await delay(300);
  },
  async requestAccountDeletion() {
    const p = await currentProfile();
    if (p) await AsyncStorage.multiRemove([`${K.profile}.${p.email.toLowerCase()}`, `${K.household}.${p.email}`, `${K.bookings}.${p.email}`, `${K.waivers}.${p.email}`, `${K.cards}.${p.email}`]);
    await AsyncStorage.removeItem(K.profile);
  },

  async getClubs() {
    return CLUBS;
  },

  async getRentalServices(club) {
    const formats = club.formats ?? ['5v5', '7v7'];
    return formats.map((f) => {
      const r = ratesOf(club, f);
      return {
        id: `${club.id}-${f}`,
        format: f,
        name: `${f} ${club.outdoor ? 'Outdoor' : 'Indoor'} Field`,
        priceFrom: r.off,
        priceTo: r.prime,
        fields: Array.from({ length: FIELDS[f] ?? 1 }, (_, i) => `Field ${i + 1}`),
        tags: ['Member benefits'],
      };
    });
  },
  async getRentalAvailability(club, service, date, duration) {
    const d = parseIso(date);
    const h = club.hours ?? DEFAULT_HOURS;
    const [open, close] = isWeekend(d) ? h.weekend : h.weekday;
    const r = ratesOf(club, service.format);
    const fi = (club.formats ?? ['5v5', '7v7']).indexOf(service.format);
    const isToday = date === iso(today());
    const out: Slot[] = [];
    for (let s = open; s + duration <= close; s += 0.5) {
      const openFields = isToday && s <= nowH() ? [] : service.fields.filter((f) => rng(hash(club.id + service.format + f + d.toDateString() + s + '|' + duration))() > (s >= 18 && s <= 21 ? 0.55 : 0.3) + fi * 0.1);
      const peak = isPeak(d, s);
      out.push({ start: s, openFields, price: (peak ? r.prime : r.off) * duration, peak: peak && r.prime !== r.off, needsApproval: s >= APPROVAL_FROM });
    }
    return out;
  },

  async getRentalExtras() {
    return RENT_EXTRAS;
  },

  async getPickupPrograms() {
    return PICKUP.map(({ slots: _s, ...p }) => p);
  },
  async getPickupSessions(club, program) {
    const p = PICKUP.find((x) => x.id === program.id);
    if (!p) return [];
    const out: PickupSession[] = [];
    const t = today();
    for (let i = 0; i < 14; i++) {
      const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + i);
      p.slots.forEach((s, k) => {
        if (!s.dow.includes(d.getDay()) || (i === 0 && s.h <= nowH())) return;
        const r = rng(hash(club.id + p.id + d.toDateString() + k));
        const full = r() < 0.15;
        out.push({ id: `${p.id}-${iso(d)}-${k}`, programId: p.id, name: p.name, date: iso(d), start: s.h, length: s.len, capacity: s.cap, spotsLeft: full ? 0 : 1 + Math.floor(r() * (s.cap - 1)), price: p.price });
      });
    }
    return out.sort((x, y) => x.date.localeCompare(y.date) || x.start - y.start);
  },

  async getCamps(club) {
    return (club.country === 'CA' ? CAMPS_CA : CAMPS_US)
      .map(([id, title, start, end]): Camp => {
        const days: string[] = [];
        for (let d = parseIso(start); d <= parseIso(end); d.setDate(d.getDate() + 1)) if (!isWeekend(d)) days.push(iso(d));
        return { id, title, start, end, days, ages: [4, 15], hours: '9:00am–3:00pm', pricePerDay: 110, spotsLeft: 4 + Math.floor(rng(hash(club.id + id))() * 20) };
      })
      .filter((k) => parseIso(k.start) > today());
  },
  async getCampAddons() {
    return ADDONS;
  },

  getHousehold: household,
  async addHouseholdMember(firstName, birthYear) {
    const p = await currentProfile();
    if (!p) throw new Error('Sign in first.');
    const m: Member = { id: uid(), firstName, lastName: p.lastName, birthYear, isAccountHolder: false };
    const kids = await load<Member[]>(`${K.household}.${p.email}`, []);
    await save(`${K.household}.${p.email}`, [...kids, m]);
    return m;
  },
  async removeHouseholdMember(memberId) {
    const p = await currentProfile();
    if (!p || memberId === 'self') return;
    const kids = await load<Member[]>(`${K.household}.${p.email}`, []);
    await save(`${K.household}.${p.email}`, kids.filter((m) => m.id !== memberId));
  },
  async getWaiverStatus(member, waiver) {
    const p = await currentProfile();
    const signed = p ? await load<Record<string, WaiverId[]>>(`${K.waivers}.${p.email}`, {}) : {};
    return { waiver, signed: !!signed[member.id]?.includes(waiver), text: WAIVER_TEXT };
  },

  async buildCart(items: CartItem[], info): Promise<Cart> {
    await delay(300);
    const lines = items.flatMap((i) => i.lines);
    const club = CLUBS.find((c) => c.id === items[0]?.clubId);
    const cart: Cart = { id: uid(), items, lines, total: lines.reduce((t, l) => t + l.amount, 0), currency: club?.currency ?? 'USD' };
    carts.set(cart.id, { cart, info });
    return cart;
  },
  async getCheckoutUrl(cart) {
    return `mock://checkout/${cart.id}`;
  },
  async getCartBooking(cart) {
    await delay(1400);
    const entry = carts.get(cart.id);
    const p = await currentProfile();
    if (!entry || !p) return null;
    carts.delete(cart.id);
    const item = entry.cart.items[0];
    const club = CLUBS.find((c) => c.id === item.clubId)!;
    const lateNight = item.kind === 'rental' && item.slots.some((s) => s.start >= APPROVAL_FROM);
    const booking: Booking = {
      ...entry.info,
      id: uid(),
      ref: 'R' + String((hash(uid()) % 90000000) + 10000000),
      kind: item.kind,
      clubId: club.id,
      clubName: club.name,
      status: lateNight ? 'pending' : 'confirmed',
      total: entry.cart.total,
      currency: entry.cart.currency,
      paidWith: 'Bond checkout (sample)',
    };
    const list = await load<Booking[]>(`${K.bookings}.${p.email}`, []);
    await save(`${K.bookings}.${p.email}`, [...list, booking]);
    const signed = await load<Record<string, WaiverId[]>>(`${K.waivers}.${p.email}`, {});
    item.waiversAccepted.forEach(({ memberId, waiver }) => {
      signed[memberId] = [...new Set([...(signed[memberId] ?? []), waiver])];
    });
    await save(`${K.waivers}.${p.email}`, signed);
    return booking;
  },

  async getSavedCards() {
    const p = await currentProfile();
    return p ? load<SavedCard[]>(`${K.cards}.${p.email}`, SAMPLE_CARDS) : [];
  },
  async removeSavedCard(cardId) {
    const p = await currentProfile();
    if (!p) return;
    const cards = await load<SavedCard[]>(`${K.cards}.${p.email}`, SAMPLE_CARDS);
    await save(`${K.cards}.${p.email}`, cards.filter((c) => c.id !== cardId));
  },

  async getBookings() {
    const p = await currentProfile();
    return p ? load<Booking[]>(`${K.bookings}.${p.email}`, []) : [];
  },
  async getBondId(member) {
    const p = await currentProfile();
    return `BOND-${(hash((p?.email ?? '') + member.id) % 1e6).toString().padStart(6, '0')}`;
  },
};
