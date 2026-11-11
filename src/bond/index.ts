// The only Bond import screens use. One setting, EXPO_PUBLIC_BOND_MODE, picks how the app talks to Bond:
//   mock (default) - native booking screens on sample data
//   live           - native booking screens on Bond's API (needs API access)
//   web            - booking and accounts on Bond's own pages, opened in the app (no API needed)
import { live } from './live';
import { mock } from './mock';
import type { BondApi } from './types';

const MODE = process.env.EXPO_PUBLIC_BOND_MODE;
export const BOND_MODE: 'mock' | 'live' | 'web' = MODE === 'live' ? 'live' : MODE === 'web' ? 'web' : 'mock';

/** Website mode: no in-app sign-in, bookings or checkout; Bond's pages do all of that. */
export const WEB_MODE = BOND_MODE === 'web';

// Website mode still uses the club list from mock.ts (names, addresses, hours).
export const bond: BondApi = BOND_MODE === 'live' ? live : mock;

export type * from './types';
export { WAIVER_IDS } from './types';
export { BOND_ACCOUNT_URL, bookingUrl, hasBondBooking, openBondPage, type WebActivity } from './web';
