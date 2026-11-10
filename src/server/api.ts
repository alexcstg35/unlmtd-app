// UNLMTD's own small server functions (not Bond). They hold anything secret:
// the Apple Wallet signing certificate, the Google Wallet issuer key, and the list of
// push tokens used to send "Pickup spots" and "Club news" alerts.
// Set EXPO_PUBLIC_API_URL to turn them on. Without it, these calls do nothing.
// See LAUNCH.md for what the server needs to do.

const BASE = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export const serverEnabled = !!BASE;

async function post<T>(path: string, body: unknown): Promise<T | null> {
  if (!BASE) return null;
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`Server error ${r.status}`);
  return (await r.json()) as T;
}

export type PushTopics = { spots: boolean; news: boolean };

/** Save this phone's push token and which alerts the person wants, for their home club. */
export async function registerPushDevice(input: { token: string; platform: 'ios' | 'android'; bondUserId?: string; clubId?: string; topics: PushTopics }) {
  await post('/push/register', input);
}

/** A link that adds the Bond ID to Apple Wallet (.pkpass) or Google Wallet (save link). Null when not set up. */
export async function getWalletPassUrl(input: { bondId: string; name: string; platform: 'ios' | 'android' }) {
  const r = await post<{ url: string }>('/wallet/pass', input);
  return r?.url ?? null;
}
