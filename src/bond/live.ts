// Real Bond Sports API. Filled in once Bond provides API access and docs (Milestone 4).
// Rules: no secret keys in the app; any call that needs one goes through a small server function.
import type { BondApi } from './types';

const notYet = (): never => {
  throw new Error('Bond API access is not set up yet. Use the mock (EXPO_PUBLIC_BOND_MODE=mock).');
};

export const live: BondApi = {
  signIn: notYet,
  signUp: notYet,
  signOut: notYet,
  getProfile: notYet,
  requestPasswordReset: notYet,
  requestAccountDeletion: notYet,
  getClubs: notYet,
  getRentalServices: notYet,
  getRentalAvailability: notYet,
  getRentalExtras: notYet,
  getPickupPrograms: notYet,
  getPickupSessions: notYet,
  getCamps: notYet,
  getCampAddons: notYet,
  getHousehold: notYet,
  addHouseholdMember: notYet,
  removeHouseholdMember: notYet,
  getWaiverStatus: notYet,
  buildCart: notYet,
  getCheckoutUrl: notYet,
  getCartBooking: notYet,
  getSavedCards: notYet,
  removeSavedCard: notYet,
  getBookings: notYet,
  getBondId: notYet,
};
