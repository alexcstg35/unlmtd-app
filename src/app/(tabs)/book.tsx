// Book tab: activity chips, then the steps for field rental, pickup or camps.
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BOND_MODE, WEB_MODE } from '@/bond';
import { CampSteps } from '@/components/booking/CampSteps';
import { Note } from '@/components/booking/parts';
import { PickupSteps } from '@/components/booking/PickupSteps';
import { RentalSteps } from '@/components/booking/RentalSteps';
import { SummaryBar } from '@/components/booking/SummaryBar';
import { TabScreen } from '@/components/Shell';
import { WebBook } from '@/components/WebBook';
import { PageHead } from '@/components/ui';
import { ACTIVITIES } from '@/lib/activities';
import { useApp } from '@/state/app';
import { useBooking } from '@/state/booking';
import { font, useTheme } from '@/theme';
import { activityColor } from '@/theme/colors';

export default function Book() {
  const { club } = useApp();
  const { c } = useTheme();
  const b = useBooking();
  if (!club) return null;

  if (WEB_MODE)
    return (
      <TabScreen index={1}>
        <PageHead title="Book">
          <Text style={[styles.sub, { color: c.text2 }]}>
            At {club.name}.{' '}
            <Text accessibilityRole="link" onPress={() => router.push('/switch-club')} style={[styles.link, { color: c.text }]}>
              Change club
            </Text>
          </Text>
        </PageHead>
        <WebBook club={club} />
      </TabScreen>
    );

  return (
    <View style={{ flex: 1 }}>
      <TabScreen index={1} contentContainerStyle={{ paddingBottom: 128 }}>
        <PageHead title="Book">
          <Text style={[styles.sub, { color: c.text2 }]}>
            At {club.name}.{' '}
            <Text accessibilityRole="link" onPress={() => router.push('/switch-club')} style={[styles.link, { color: c.text }]}>
              Change club
            </Text>
          </Text>
        </PageHead>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Activity">
          {ACTIVITIES.map((a) => {
            const on = a.id === b.act;
            return (
              <Pressable
                key={a.id}
                onPress={() => on || b.startActivity(a.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[styles.chip, on ? { backgroundColor: c.text, borderColor: 'transparent' } : { backgroundColor: c.surface, borderColor: c.rule }]}>
                <View style={[styles.chipDot, { backgroundColor: activityColor(a.color) }]} />
                <Text style={[styles.chipT, { color: on ? c.bg : c.text }]}>{a.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {BOND_MODE === 'mock' ? <Note>Sample data. Availability, prices, sign-in and payment are simulated, and nothing is charged.</Note> : null}

        {b.act === 'rent-a-field' ? <RentalSteps club={club} /> : b.act === 'pickup-soccer' ? <PickupSteps club={club} /> : <CampSteps club={club} />}
      </TabScreen>
      <SummaryBar />
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 8, fontFamily: font.regular, fontSize: 15 },
  link: { fontFamily: font.semibold, textDecorationLine: 'underline' },
  chips: { gap: 8, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingLeft: 12, paddingRight: 15, borderRadius: 999, borderWidth: 1 },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipT: { fontFamily: font.semibold, fontSize: 14 },
});
