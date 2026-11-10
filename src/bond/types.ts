// Data shapes the screens use. Both mock.ts and live.ts return these,
// so screens never see Bond's raw API responses.

export type Hours = { weekday: [open: number, close: number]; weekend: [open: number, close: number] };

export type Club = {
  id: string;
  name: string;
  city: string;
  region: string;
  country: 'US' | 'CA';
  currency: 'USD' | 'CAD';
  lat: number;
  lng: number;
  timezone: string; // IANA, e.g. "America/New_York"
  address?: string;
  phone?: string;
  email?: string;
  hours?: Hours;
  formats?: string[];
  outdoor?: boolean;
  openingSoon?: boolean;
  pageUrl: string;
};

export type RentalService = {
  id: string;
  name: string; // "5v5 Indoor Field"
  format: string; // "5v5"
  priceFrom: number; // per hour, off-peak
  priceTo: number; // per hour, peak
  fields: string[]; // "Field 1", "Field 2"
  tags: string[]; // "Member benefits"
};

export type Slot = {
  start: number; // hour of day, 30-minute steps (18.5 = 6:30pm)
  openFields: string[];
  price: number; // for the chosen duration
  peak: boolean;
  needsApproval: boolean;
};

export type PickupProgram = { id: string; name: string; ages: string; minAge: number; blurb: string; rules: string[]; price: number };

export type PickupSession = {
  id: string;
  programId: string;
  name: string;
  date: string; // yyyy-mm-dd
  start: number;
  length: number;
  capacity: number;
  spotsLeft: number;
  price: number;
};

export type Camp = {
  id: string;
  title: string;
  start: string;
  end: string;
  days: string[]; // weekdays only, yyyy-mm-dd
  ages: [min: number, max: number];
  hours: string;
  pricePerDay: number;
  spotsLeft: number;
};

export type CampAddon = { id: string; name: string; detail: string; pricePerDay: number };

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  isAccountHolder: boolean;
};

export type Profile = { id: string; firstName: string; lastName: string; email: string };

export type WaiverId = 'adult' | 'pickup' | 'youth';
export const WAIVER_IDS: WaiverId[] = ['adult', 'pickup', 'youth'];

export type SavedCard = { id: string; brand: string; last4: string; exp: string };
export type WaiverStatus = { waiver: WaiverId; signed: boolean; text: string };

export type RentalExtra = { id: string; name: string; price: number };

export type CartLine = { label: string; amount: number };

type CartBase = {
  clubId: string;
  /** Form answers: phone, reservation name, emergency contact and so on. */
  answers: Record<string, string>;
  /** Member ids that accepted the waiver in this checkout. */
  waiversAccepted: { memberId: string; waiver: WaiverId }[];
  /** The app's price estimate. Bond's cart total is what gets charged. */
  lines: CartLine[];
};

export type CartItem = CartBase &
  (
    | { kind: 'rental'; serviceId: string; date: string; duration: number; slots: { start: number; field: string }[]; extras: Record<string, number>; forMemberId: string }
    | { kind: 'pickup'; sessionId: string; memberIds: string[] }
    | { kind: 'camp'; campId: string; days: string[]; addons: string[]; memberIds: string[] }
  );

export type Cart = { id: string; items: CartItem[]; lines: CartLine[]; total: number; currency: 'USD' | 'CAD' };

export type BookingStatus = 'confirmed' | 'pending' | 'waitlist';

export type Booking = {
  id: string;
  ref: string;
  kind: 'rental' | 'pickup' | 'camp';
  title: string;
  when: string; // "Tuesday, November 10, 6:00pm–7:00pm"
  short: string; // "Tue, Nov 10 at 6:00pm, Field 1"
  detail: string;
  clubId: string;
  clubName: string;
  date: string;
  start: number;
  people?: string;
  status: BookingStatus;
  total: number;
  currency: 'USD' | 'CAD';
  paidWith: string;
};

export type SignUpInput = { firstName: string; lastName: string; email: string; password: string };

/** Everything the app asks of Bond. mock.ts and live.ts both implement this. */
export interface BondApi {
  // Account (Bond Auth SDK)
  signIn(email: string, password: string): Promise<Profile>;
  signUp(input: SignUpInput): Promise<Profile>;
  signOut(): Promise<void>;
  getProfile(): Promise<Profile | null>;
  requestPasswordReset(email: string): Promise<void>;
  requestAccountDeletion(): Promise<void>;

  getClubs(): Promise<Club[]>;

  getRentalServices(club: Club): Promise<RentalService[]>;
  getRentalAvailability(club: Club, service: RentalService, date: string, duration: number): Promise<Slot[]>;
  getRentalExtras(club: Club): Promise<RentalExtra[]>;

  getPickupPrograms(club: Club): Promise<PickupProgram[]>;
  getPickupSessions(club: Club, program: PickupProgram): Promise<PickupSession[]>;

  getCamps(club: Club): Promise<Camp[]>;
  getCampAddons(club: Club, camp: Camp): Promise<CampAddon[]>;

  getHousehold(): Promise<Member[]>;
  addHouseholdMember(firstName: string, birthYear: number): Promise<Member>;
  removeHouseholdMember(memberId: string): Promise<void>;
  getWaiverStatus(member: Member, waiver: WaiverId): Promise<WaiverStatus>;

  buildCart(items: CartItem[], booking: Pick<Booking, 'title' | 'when' | 'short' | 'detail' | 'date' | 'start' | 'people'>): Promise<Cart>;
  /** Bond-hosted checkout, opened in-app with expo-web-browser. Bond sends the person back to returnUrl. */
  getCheckoutUrl(cart: Cart, returnUrl: string): Promise<string>;
  /** After checkout: the booking Bond created for this cart, or null if it wasn't paid. */
  getCartBooking(cart: Cart): Promise<Booking | null>;

  /** Cards saved in the Bond account (added on Bond's checkout). Display only: the app never sees full numbers. */
  getSavedCards(): Promise<SavedCard[]>;
  removeSavedCard(cardId: string): Promise<void>;

  getBookings(): Promise<Booking[]>;
  getBondId(member: Member): Promise<string>;
}
