// "Your booking" sheet: pass, status, check-in, split cost, what was paid, and how to cancel or change.
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { STATUS } from '@/components/BookingCard';
import { ContactClub, shareSplit } from '@/components/checkout/BookingDone';
import { StatusChip } from '@/components/checkout/parts';
import { Sheet } from '@/components/Sheet';
import { Button, Row, Rows } from '@/components/ui';
import { money } from '@/lib/format';
import { useApp } from '@/state/app';
import { useData } from '@/state/data';
import { brand, display, font, useTheme } from '@/theme';

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings } = useData();
  const { clubs } = useApp();
  const { c } = useTheme();
  const b = bookings.find((x) => x.id === id);
  const club = clubs.find((x) => x.id === b?.clubId);

  if (!b || !club)
    return (
      <Sheet title="Your booking">
        <Text style={[styles.missing, { color: c.text2 }]}>This booking isn’t in your account anymore. Pull down on Bookings to refresh.</Text>
      </Sheet>
    );

  const st = STATUS[b.status];
  return (
    <Sheet title="Your booking">
      <View style={styles.pass}>
        <Text style={[display(32), { color: brand.onPitch }]}>{b.title}</Text>
        <View style={{ marginTop: 8 }}>
          <StatusChip kind={st.kind} label={st.label} />
        </View>
        <Text style={styles.pw}>{b.when}</Text>
        <Text style={styles.pc}>
          {b.clubName}
          {b.people ? `. ${b.people}` : ''}
        </Text>
        <Text style={styles.pc}>
          {b.detail}. Ref {b.ref}
        </Text>
      </View>

      <View style={{ gap: 10, marginTop: 14 }}>
        {b.status === 'confirmed' ? <Button onPress={() => router.push({ pathname: '/bond-id/[member]', params: { member: 'self' } })}>Show my Bond ID to check in</Button> : null}
        {b.kind === 'rental' ? (
          <Button kind="ghost" onPress={() => shareSplit(b)}>
            Split the cost with your team
          </Button>
        ) : null}
      </View>

      <View style={{ marginTop: 14 }}>
        <Rows>
          <Row first title="Paid" sub={`${money(b.total, b.currency)} with ${b.paidWith}`} />
        </Rows>
      </View>

      <ContactClub booking={b} club={club} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  missing: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  pass: { padding: 20, borderRadius: 22, backgroundColor: brand.pitch },
  pw: { marginTop: 8, color: brand.onPitch, fontFamily: font.regular, fontSize: 14.5 },
  pc: { marginTop: 2, color: brand.onPitch2, fontFamily: font.regular, fontSize: 13.5, lineHeight: 19 },
});
