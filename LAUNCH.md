# Launch checklist

What's left to get the UNLMTD Soccer app onto TestFlight, Google Play internal testing, and then the stores. The code side of Milestone 5 is done. Everything below needs an account, a certificate or a decision from UNLMTD.

Commands assume Node is on your PATH (`export PATH="$HOME/.local/node/bin:$PATH"`) and that you run them in this folder.

## 1. Accounts (UNLMTD signs up)

- [ ] **Apple Developer Program**, as an organization ($99/year). Needs UNLMTD's D-U-N-S number. Approval can take a few days.
- [ ] **Google Play Console**, as an organization ($25 one-time). New personal accounts must run a 14-day closed test before going public, so use an organization account.
- [ ] **Expo account** (free to start). Create an organization called UNLMTD and invite the team.

## 2. Confirm before the first build

- [ ] **App ID**: `com.unlmtdsoccer.app` for both iOS and Android (in `app.json`). It can't be changed after the first store upload.
- [ ] **App name on the home screen**: "UNLMTD Soccer".
- [ ] **App icon**: `assets/icon.png`, drawn from the logo on deep green. Swap in a designed icon if UNLMTD has one.

## 3. Link the project to Expo

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest init
```

`eas init` adds the project ID to `app.json`. Push notifications need it: until it's there, the app schedules game reminders but doesn't register for push.

## 4. Test builds

| Profile | What it's for | Data |
| --- | --- | --- |
| `development` | Your own phone, with live reload from `npx expo start` | Sample |
| `preview` | Share an install link with the team (Android APK, iOS ad hoc) | Sample |
| `testing` | TestFlight and Google Play internal testing | Sample |
| `production` | The stores | **Live Bond** (needs Milestone 4) |

```bash
npx eas-cli@latest build --profile testing --platform all
```

```bash
npx eas-cli@latest submit --profile testing --platform ios
```

```bash
npx eas-cli@latest submit --profile testing --platform android
```

- iOS: EAS creates the signing certificate and the push key the first time (sign in with the Apple account when asked). The build lands in TestFlight; add testers in App Store Connect.
- Android: the very first upload to Google Play must be done by hand in Play Console (upload the `.aab` EAS gives you). After that, `eas submit` works. It needs a Google service account key; see Expo's guide "Submit to the Google Play Store".
- Android push: upload a Firebase (FCM v1) service account key with `npx eas-cli@latest credentials`.

## 5. Notifications

- **Game reminders** work now. They're scheduled on the phone, two hours before each confirmed booking, and turn off with the "Game reminders" switch.
- **Pickup spots** and **Club news** need UNLMTD's server to send them:
  - The app sends the phone's push token, home club and chosen alerts to `POST {EXPO_PUBLIC_API_URL}/push/register`.
  - The server sends through Expo's push service (`https://exp.host/--/api/v2/push/send`). Include `data.url` (for example `/book`) so tapping opens the right screen.
  - "Pickup spots" needs Bond to tell the server when a full session gets a free spot (a webhook, or checking every few minutes).

## 6. Apple Wallet and Google Wallet passes

The "Add to Apple Wallet" and "Add to Google Wallet" buttons on the Bond ID call `POST {EXPO_PUBLIC_API_URL}/wallet/pass` with `{ bondId, name, platform }` and open the `url` it returns.

- [ ] **Apple**: create a Pass Type ID and its certificate in the Apple Developer account. The server builds and signs a `.pkpass` with the Bond ID as a QR code. The link must serve it as `application/vnd.apple.pkpass`.
- [ ] **Google**: create a Google Wallet issuer account and a "generic pass" class. The server signs a JWT and returns `https://pay.google.com/gp/v/save/<jwt>`.
- [ ] Pass design: deep green background, off-white logo, the member's name, home club, and the Bond ID QR code.

Until the server exists, the buttons say "Adding to Apple Wallet isn't set up yet".

## 7. The small server

The app holds no secrets. One small server holds the Wallet signing keys and the push token list, and covers any Bond call that needs a secret. Expo's own hosting (EAS Hosting, with Expo Router API routes) is the simplest fit. Set its address as `EXPO_PUBLIC_API_URL` in the build profiles in `eas.json`.

## 8. Store listings

- [ ] **Screenshots**: iPhone 6.9" (1320 × 2868) and Android phone. Use a `preview` build on a real phone, signed in with a sample account.
- [ ] **Privacy policy** link: https://unlmtdsoccer.com/en/privacy-policy (check it covers the app).
- [ ] **Support** link or email.
- [ ] **Apple App Privacy** and **Google Data safety** forms. The app handles:
  - name, email, phone number
  - children's first names and birth years (household)
  - approximate location, only when "Find my nearest club" is tapped, and not stored
  - purchases (handled by Bond's checkout; the app never sees card numbers)
  - push token
- [ ] **Age rating**: no objectionable content. The app is for adults booking for themselves and their kids, not aimed at kids.
- [ ] **Sign-in for reviewers**: Apple and Google need a working test account. Create a Bond test account with a household member.
- [ ] **Account deletion** (Apple requires it): the app has "Delete account". Confirm with Bond which call actually deletes a Bond account (Milestone 4).

## 9. Before the public release

- [ ] Milestone 4: Bond API connected (`src/bond/live.ts`), and the `production` profile tested end to end.
- [ ] Bond's check-in format for the Bond ID QR code.
- [ ] Bond's real camp application form (the emergency-contact fields are placeholders).
- [ ] Real waiver text from Bond.
- [ ] Club phone numbers, emails and hours for every club (sample data only has a few).
