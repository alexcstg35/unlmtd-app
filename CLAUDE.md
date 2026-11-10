# UNLMTD Soccer app

Customer app for UNLMTD Soccer (20+ indoor soccer clubs in the US and Canada). Bookings, accounts, waivers and payments all run on Bond Sports. The app is a branded front end on top of Bond.

`prototype.html` in this folder is the approved design and behavior. Open it in a browser to see every screen. Match its screens, step order, wording, colors and animations. Its data is fake; the real app gets everything from Bond.

## Stack
- Expo (React Native) with TypeScript and expo-router, one codebase for iPhone and Android.
- Builds and store submission through Expo EAS (`eas build`, `eas submit`).
- No secret keys inside the app. If a Bond call needs a secret, route it through a small server function.

## Brand
- Deep green `#00201b` (backgrounds, top bar, tab bar), off-white `#f8e6cf` (logo color, text on green).
- Activity colors: field rental yellow `#f3d02c`, pickup red `#f2523b`, camps blue `#59a8ff`, success green `#33d17f`.
- Logo: `assets/logo-off-white.png`.
- Light and dark mode, as in the prototype.

## Architecture
All Bond access lives in `src/bond/`, behind one interface:
- `src/bond/types.ts` defines the data shapes (Club, RentalService, Slot, PickupSession, Camp, Member, Cart, Booking).
- `src/bond/mock.ts` returns sample data copied from the prototype.
- `src/bond/live.ts` calls the real Bond API, added once Bond provides API access and docs.
- Screens import only from `src/bond/index.ts`, which switches between mock and live with one setting.

Functions the screens need:
- `signIn`, `signUp`, `signOut`, `getProfile` (Bond account, via Bond's Auth SDK)
- `getClubs`
- `getRentalServices(club)`, `getRentalAvailability(club, service, date, duration)`
- `getPickupPrograms(club)`, `getPickupSessions(club, program)`
- `getCamps(club)`, `getCampAddons(club, camp)`
- `getHousehold`, `addHouseholdMember`, `getWaiverStatus(member, waiver)`
- `buildCart(items)`, `getCheckoutUrl(cart)`: payment happens on Bond-hosted checkout, opened inside the app with expo-web-browser, never in an external browser
- `getBookings`, `getBondId(member)`

## Flows (checked on the live site, South Boston club)
1. **First launch:** pick home club (search, nearest), saved on the device and switchable from the top bar. Then sign in with Bond, create a Bond account, or browse first.
2. **Field rental:**
   1. Pick a service, e.g. "5v5 Indoor Field, $150–220 / 1 hr", tagged "Member benefits".
   2. Pick a date and a duration.
   3. Pick one or more slots from the field-by-time grid. Slots run in 30-minute steps and peak prices are tagged PEAK.
   4. Extras: soccer ball rental, +$5.
   5. Form: email (prefilled), phone, name of the reservation, sport other than soccer, promo code, adult waiver (scroll to read before agreeing).
   6. Payment. Late-night slots need club approval.
3. **Pickup:** program (Pick-Up, Women's Pick-Up) → session list with spots left → participants from the household (16+) → adult pickup waiver and phone → payment. Single sessions only; the recurring membership stays out of the app.
4. **Camps:** camp (ages 4 to 15, 9am to 3pm, $110 per day) → number of days and which days → add-ons per day (early drop-off $15, lunch $25, late pickup $30) → campers from the household (age enforced) → camp application and waiver → payment.
5. **After booking:**
   - Booking status: confirmed, or awaiting club approval.
   - Check-in with the Bond ID QR, with Add to Apple Wallet / Google Wallet.
   - Split-cost link for field rentals.
   - No cancel button: show Call / Email the club, with the booking reference prefilled.
6. **Account:**
   - Bond profile and household members.
   - Saved cards, from Bond.
   - Notifications, appearance, sign out.
   - Delete account (required by Apple).

## Milestones
1. Expo project, brand theme, tab bar (Home, Book, Bookings, Account), onboarding with club choice, all on mock data.
2. Field rental, pickup and camp flows on mock data, matching the prototype.
3. Bookings tab, Bond ID, account, household.
4. Swap `mock.ts` for `live.ts` once Bond API access arrives.
5. Push notifications, Wallet pass, store assets, TestFlight and Play internal testing.

## Rules
- Plain, friendly wording, no jargon. Match the prototype's copy.
- Never store card numbers or passwords in the app.
- Ask before adding a dependency that isn't standard in Expo.
