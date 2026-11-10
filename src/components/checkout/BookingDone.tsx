// After payment: tick, status, the booking pass, split-cost link, and how to cancel or change.
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Share, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Booking, Club } from '@/bond';
import { Button } from '@/components/ui';
import { money } from '@/lib/format';
import { useApp } from '@/state/app';
import { brand, display, font, useTheme } from '@/theme';

import { StatusChip } from './parts';
import { closeModal } from '@/components/Sheet';

export function BookingDone({ booking: b, email, club }: { booking: Booking; email: string; club: Club }) {
  const { c } = useTheme();
  // The tick draws in from left to right, like the prototype's stroke animation.
  const tick = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(tick, { toValue: 1, duration: 500, delay: 200, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false }).start();
  }, [tick]);

  const pending = b.status === 'pending';
  const head = pending ? 'Request sent' : b.kind === 'rental' ? 'You’re booked' : 'You’re registered';
  const paid = `${money(b.total, b.currency)} with ${b.paidWith}`;
  const sub = pending ? `Paid ${paid}. ${b.clubName} reviews late-night bookings and confirms by email.` : `Paid ${paid}. Bond is emailing your receipt to ${email}.`;

  return (
    <View style={styles.done}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.check}>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden', width: tick.interpolate({ inputRange: [0, 1], outputRange: [24, 62] }) }}>
          <Svg width={84} height={84} viewBox="0 0 84 84">
            <Path d="M27 43l10 10 21-22" fill="none" stroke={brand.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      </View>
      <Text accessibilityRole="header" style={[display(58, 0.86), { color: c.text, marginTop: 18, marginBottom: 8, textAlign: 'center' }]}>
        {head}
      </Text>
      <StatusChip center kind={pending ? 'pend' : 'ok'} label={pending ? 'Awaiting club approval' : 'Confirmed'} />
      <Text style={[styles.sub, { color: c.text2 }]}>{sub}</Text>

      <View style={styles.pass}>
        <Text style={[display(32), { color: brand.onPitch }]}>{b.title}</Text>
        <Text style={styles.pw}>{b.when}</Text>
        <Text style={styles.pc}>
          {b.clubName}
          {b.people ? `. ${b.people}` : ''}. Ref {b.ref}
        </Text>
      </View>

      {!pending ? <Text style={[styles.checkin, { color: c.text }]}>Check in at the front desk with your Bond ID.</Text> : null}
      {b.kind === 'rental' ? (
        <Button kind="ghost" style={styles.full} onPress={() => shareSplit(b)}>
          Split the cost with your team
        </Button>
      ) : null}
      <Button style={[styles.full, { marginTop: 22 }]} onPress={() => router.dismissTo('/bookings')}>
        See my bookings
      </Button>
      <Button kind="ghost" style={styles.full} onPress={() => closeModal()}>
        Done
      </Button>

      <ContactClub booking={b} club={club} />
    </View>
  );
}

/** No cancel button: call or email the club with the booking reference filled in. */
export function ContactClub({ booking: b, club }: { booking: Booking; club: Club }) {
  const { c } = useTheme();
  const { user } = useApp();
  const subject = `Booking ${b.ref}: cancel or change`;
  const body = `Hi ${club.name} team,\n\nI'd like to cancel or change this booking:\n${b.title}\n${b.when}\nReference: ${b.ref}\nName: ${user?.firstName ?? ''} ${user?.lastName ?? ''}\n\nThank you`;
  return (
    <View style={[styles.contact, { backgroundColor: c.surface, borderColor: c.rule }]}>
      <Text style={[styles.cH, { color: c.text }]}>Need to cancel or change it?</Text>
      <Text style={[styles.cP, { color: c.text2 }]}>Bookings can’t be cancelled in the app. Contact {club.name} and the team will sort it out. Refunds follow the club’s policy.</Text>
      <View style={styles.cBtns}>
        {club.phone ? (
          <Button kind="solid" style={styles.cBtn} onPress={() => Linking.openURL(`tel:${club.phone!.replace(/[^\d+]/g, '')}`)}>
            {`Call ${club.name}`}
          </Button>
        ) : null}
        {club.email ? (
          <Button kind={club.phone ? 'ghost' : 'solid'} style={styles.cBtn} onPress={() => Linking.openURL(`mailto:${club.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)}>
            {`Email ${club.name}`}
          </Button>
        ) : null}
        {!club.phone && !club.email ? (
          <Button kind="solid" style={styles.cBtn} onPress={() => Linking.openURL(club.pageUrl)}>
            Club contact details
          </Button>
        ) : null}
      </View>
    </View>
  );
}

/** Split-cost link for a field rental, through the phone's share sheet. */
export function shareSplit(b: Booking) {
  const link = `https://bondsports.co/split/${b.ref}`;
  Share.share({ title: 'Split the field', message: `Chip in for ${b.title}, ${b.when}: ${link}`, url: link }).catch(() => {});
}

const styles = StyleSheet.create({
  done: { alignItems: 'center' },
  check: { width: 84, height: 84, borderRadius: 42, backgroundColor: brand.yellow },
  sub: { marginTop: 10, maxWidth: 320, textAlign: 'center', fontFamily: font.regular, fontSize: 16, lineHeight: 23 },
  pass: { alignSelf: 'stretch', marginTop: 22, padding: 20, borderRadius: 22, backgroundColor: brand.pitch },
  pw: { marginTop: 8, color: brand.onPitch, fontFamily: font.regular, fontSize: 14.5 },
  pc: { marginTop: 2, color: brand.onPitch2, fontFamily: font.regular, fontSize: 13.5 },
  checkin: { marginTop: 14, fontFamily: font.regular, fontSize: 15 },
  full: { alignSelf: 'stretch', marginTop: 12 },
  contact: { alignSelf: 'stretch', marginTop: 22, padding: 16, borderRadius: 18, borderWidth: 1 },
  cH: { marginBottom: 4, fontFamily: font.bold, fontSize: 15.5 },
  cP: { marginBottom: 14, fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  cBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cBtn: { flexGrow: 1, flexBasis: 130, height: 46 },
});
