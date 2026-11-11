// Book tab in website mode: one card per activity, each opening the club's Bond booking page.
import { StyleSheet, Text, View } from 'react-native';

import { bookingUrl, hasBondBooking, openBondPage, type Club } from '@/bond';
import { ACTIVITIES } from '@/lib/activities';
import { font, title, useTheme } from '@/theme';
import { activityColor } from '@/theme/colors';

import { Note } from './booking/parts';
import { Icon } from './Icon';
import { Press } from './ui';

export function WebBook({ club }: { club: Club }) {
  const { c } = useTheme();
  return (
    <View>
      <Note>Booking opens Bond Sports, UNLMTD’s booking system, inside the app. Sign in once and you stay signed in.</Note>
      <View style={styles.list}>
        {ACTIVITIES.map((a) => {
          const onBond = hasBondBooking(club, a.id);
          return (
            <Press
              key={a.id}
              onPress={() => openBondPage(bookingUrl(club, a.id))}
              label={`${a.name}. ${onBond ? 'Book on Bond Sports' : 'See options on unlmtdsoccer.com'}`}
              style={[styles.card, { backgroundColor: c.surface, borderColor: c.rule }]}>
              <View style={[styles.blob, { backgroundColor: activityColor(a.color) }]} />
              <View style={[styles.ring, { borderColor: activityColor(a.color) }]} />
              <View style={{ flex: 1 }}>
                <Text style={[title(26), { color: c.text }]}>{a.name}</Text>
                <Text style={[styles.sub, { color: c.text2 }]}>{a.sub}</Text>
                <Text style={[styles.cta, { color: c.text }]}>{onBond ? 'Book on Bond Sports' : 'See options on unlmtdsoccer.com'}</Text>
              </View>
              <Icon name="ext" size={18} color={c.text} opacity={0.5} />
            </Press>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, paddingTop: 16, paddingHorizontal: 20 },
  card: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, minHeight: 132, paddingTop: 40, paddingHorizontal: 16, paddingBottom: 16, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  blob: { position: 'absolute', top: -30, left: -30, width: 64, height: 64, borderRadius: 32 },
  ring: { position: 'absolute', top: -47, left: -47, width: 98, height: 98, borderRadius: 49, borderWidth: 1.5, opacity: 0.7 },
  sub: { marginTop: 6, fontFamily: font.regular, fontSize: 13.5, lineHeight: 18 },
  cta: { marginTop: 10, fontFamily: font.bold, fontSize: 14, textDecorationLine: 'underline' },
});
