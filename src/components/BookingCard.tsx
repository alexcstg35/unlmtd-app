// Booking card used on Home ("Your next game") and the Bookings tab.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { Booking, BookingStatus } from '@/bond';
import { monthShort, parseIso } from '@/lib/format';
import { brand, font, title, useTheme } from '@/theme';

import { StatusChip } from './checkout/parts';
import { Icon } from './Icon';
import { Press } from './ui';

export const KIND_COLOR = { rental: brand.yellow, pickup: brand.red, camp: brand.blue } as const;

export const STATUS: Record<BookingStatus, { kind: 'ok' | 'pend' | 'wait'; label: string }> = {
  confirmed: { kind: 'ok', label: 'Confirmed' },
  pending: { kind: 'pend', label: 'Awaiting club approval' },
  waitlist: { kind: 'wait', label: 'On the waitlist' },
};

export function BookingCard({ booking: b, past }: { booking: Booking; past?: boolean }) {
  const { c } = useTheme();
  const d = parseIso(b.date);
  const st = STATUS[b.status];
  return (
    <Press
      onPress={() => router.push({ pathname: '/booking/[id]', params: { id: b.id } })}
      label={`${b.title}. ${b.short}. ${b.clubName}. ${st.label}`}
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.rule, opacity: past ? 0.6 : 1 }]}>
      <View style={[styles.date, { backgroundColor: KIND_COLOR[b.kind] }]}>
        <Text style={[title(26), { color: brand.ink, lineHeight: 28 }]}>{d.getDate()}</Text>
        <Text style={styles.month}>{monthShort(d)}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.t, { color: c.text }]}>{b.title}</Text>
        <Text style={[styles.s, { color: c.text2 }]}>{b.short}</Text>
        <Text style={[styles.s, { color: c.text2 }]}>
          {b.clubName}
          {b.people ? `, ${b.people}` : ''}
        </Text>
        <View style={{ marginTop: 6 }}>
          <StatusChip kind={st.kind} label={st.label} />
        </View>
      </View>
      <Icon name="chev" size={18} color={c.text} opacity={0.45} />
    </Press>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingLeft: 12, paddingRight: 14, borderRadius: 18, borderWidth: 1 },
  date: { width: 58, height: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  month: { color: brand.ink, fontFamily: font.bold, fontSize: 11.5 },
  t: { fontFamily: font.bold, fontSize: 15.5, lineHeight: 19 },
  s: { marginTop: 2, fontFamily: font.regular, fontSize: 13 },
});
