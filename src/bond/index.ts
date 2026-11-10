// The only Bond import screens use. Switch with EXPO_PUBLIC_BOND_MODE=live (defaults to mock).
import { live } from './live';
import { mock } from './mock';
import type { BondApi } from './types';

export const BOND_MODE = process.env.EXPO_PUBLIC_BOND_MODE === 'live' ? 'live' : 'mock';

export const bond: BondApi = BOND_MODE === 'live' ? live : mock;

export type * from './types';
export { WAIVER_IDS } from './types';
