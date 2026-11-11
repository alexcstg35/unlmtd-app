// "Website" mode: booking happens on Bond's own pages, opened inside the app.
// Used while Bond has no API for us (EXPO_PUBLIC_BOND_MODE=web).
//
// Each UNLMTD club is its own Bond organization. These links are the ones
// unlmtdsoccer.com embeds on its booking pages (read from the live site on 2026-11-10).
// When a club has no Bond link, the app opens that club's booking page on unlmtdsoccer.com.
import * as WebBrowser from 'expo-web-browser';

import { brand } from '@/theme';

import type { Club } from './types';

export type WebActivity = 'rent-a-field' | 'pickup-soccer' | 'youth-camp';

const RENT = (org: number, portal: number, product?: number) =>
  `https://bondsports.co/online-rentals/organization/${org}/portal/${portal}?duration=60${product ? `&productId=${product}` : ''}`;
const PICKUP = (id: number) => `https://bondsports.co/activity/programs/CO_ED-adult-SOCCER/${id}`;
const CAMP = (id: number) => `https://bondsports.co/activity/programs/CO_ED-youth-SOCCER/${id}`;

const LINKS: Record<string, Partial<Record<WebActivity, string>>> = {
  'wall-street': { 'rent-a-field': RENT(450, 393, 81789), 'pickup-soccer': PICKUP(10292), 'youth-camp': CAMP(6265) },
  'sunset-park': { 'rent-a-field': RENT(434, 396, 73068), 'youth-camp': CAMP(5722) },
  'crown-heights': { 'rent-a-field': RENT(436, 380, 73161), 'pickup-soccer': PICKUP(6717), 'youth-camp': CAMP(5749) },
  'long-island-city': { 'rent-a-field': RENT(435, 427, 90551), 'pickup-soccer': PICKUP(10626), 'youth-camp': CAMP(5728) },
  'new-rochelle': { 'rent-a-field': RENT(431, 392), 'pickup-soccer': PICKUP(5454), 'youth-camp': CAMP(5452) },
  'south-boston': { 'rent-a-field': RENT(581, 429, 142597), 'pickup-soccer': PICKUP(15204), 'youth-camp': CAMP(15198) },
  malden: { 'rent-a-field': RENT(545, 761, 124046), 'pickup-soccer': PICKUP(16781), 'youth-camp': CAMP(16554) },
  'new-haven': { 'rent-a-field': RENT(371, 446, 109074), 'pickup-soccer': PICKUP(4630), 'youth-camp': CAMP(10610) },
  hochelaga: { 'rent-a-field': RENT(437, 466, 161184), 'youth-camp': CAMP(6043) },
  plateau: { 'rent-a-field': RENT(438, 465, 128316), 'youth-camp': CAMP(5847) },
  lasalle: { 'rent-a-field': RENT(457, 464, 128324), 'pickup-soccer': PICKUP(11655), 'youth-camp': CAMP(6274) },
  'toronto-etobicoke': { 'rent-a-field': RENT(505, 455, 130839), 'pickup-soccer': PICKUP(13691), 'youth-camp': CAMP(13435) },
};

/** Bond's customer account page: profile, family, bookings, payment methods. */
export const BOND_ACCOUNT_URL = 'https://bondsports.co/user';

/** True when this club books on Bond; false means the website page (contact form or "coming soon"). */
export const hasBondBooking = (club: Club, act: WebActivity) => !!LINKS[club.id]?.[act];

export function bookingUrl(club: Club, act: WebActivity) {
  return LINKS[club.id]?.[act] ?? `https://unlmtdsoccer.com/en/booking/${club.id}/${act}`;
}

/**
 * Open a Bond page in the in-app browser (Safari View Controller on iPhone, Chrome Custom Tabs
 * on Android). Not an embedded web view: Google sign-in refuses embedded views, and the in-app
 * browser keeps people signed in to Bond between visits.
 */
export function openBondPage(url: string) {
  return WebBrowser.openBrowserAsync(url, {
    toolbarColor: brand.pitch,
    controlsColor: brand.yellow,
    secondaryToolbarColor: brand.pitch,
    enableBarCollapsing: true,
    showTitle: true,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    dismissButtonStyle: 'done',
  });
}
