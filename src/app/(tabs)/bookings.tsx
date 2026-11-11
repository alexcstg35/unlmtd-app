// Bookings tab: signed-out prompt, empty state, or upcoming and past bookings.
import { router } from 'expo-router';
import { RefreshControl, View } from 'react-native';

import { BOND_ACCOUNT_URL, openBondPage, WEB_MODE } from '@/bond';
import { BookingCard } from '@/components/BookingCard';
import { EmptyCard } from '@/components/EmptyCard';
import { TabScreen } from '@/components/Shell';
import { PageHead, SectionTitle } from '@/components/ui';
import { useApp } from '@/state/app';
import { useStartBooking } from '@/state/booking';
import { useData } from '@/state/data';
import { useTheme } from '@/theme';

export default function Bookings() {
  const { user } = useApp();
  const { c } = useTheme();
  const { bookings, upcoming, past, loading, refresh } = useData();
  const startBooking = useStartBooking();

  return (
    <TabScreen index={2} refreshControl={user ? <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={c.text2} /> : undefined}>
      <PageHead title="Bookings" />
      {WEB_MODE ? (
        <EmptyCard
          heading="Your games are in your Bond account"
          body="Field rentals, pickup games and camps you booked in the app or on unlmtdsoccer.com are all in your Bond Sports account, with your receipts and check-in details."
          actions={[
            { label: 'Open my bookings', kind: 'solid', onPress: () => openBondPage(BOND_ACCOUNT_URL) },
            { label: 'Book something', kind: 'ghost', onPress: () => startBooking('rent-a-field') },
          ]}
        />
      ) : !user ? (
        <EmptyCard
          heading="Sign in to see your games"
          body="Sign in with your Bond Sports account. Field rentals, pickup games and camps you booked in the app or on unlmtdsoccer.com all show up here."
          actions={[
            { label: 'Sign in with Bond Sports', kind: 'solid', onPress: () => router.push('/sign-in') },
            { label: 'Create a Bond account', kind: 'ghost', onPress: () => router.push({ pathname: '/sign-in', params: { mode: 'signup' } }) },
          ]}
        />
      ) : !bookings.length ? (
        <EmptyCard
          heading="No games on the calendar"
          body="Book a field, a pickup game or a camp and it shows up here."
          actions={[
            { label: 'Rent a field', kind: 'solid', onPress: () => startBooking('rent-a-field') },
            { label: 'Join pickup', kind: 'ghost', onPress: () => startBooking('pickup-soccer') },
          ]}
        />
      ) : (
        <>
          {upcoming.length ? (
            <View style={{ paddingTop: 26, paddingHorizontal: 20 }}>
              <SectionTitle>Upcoming</SectionTitle>
              <View style={{ gap: 10 }}>
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </View>
            </View>
          ) : null}
          {past.length ? (
            <View style={{ paddingTop: 26, paddingHorizontal: 20 }}>
              <SectionTitle>Past</SectionTitle>
              <View style={{ gap: 10 }}>
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} past />
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </TabScreen>
  );
}
