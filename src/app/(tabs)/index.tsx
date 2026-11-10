import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { BookingCard } from '@/components/BookingCard';
import { ClubDetails } from '@/components/ClubDetails';
import { PitchLines } from '@/components/Icon';
import { TabScreen } from '@/components/Shell';
import { Button, Press, SectionTitle } from '@/components/ui';
import { ACTIVITIES } from '@/lib/activities';
import { openStatus } from '@/lib/format';
import { useApp } from '@/state/app';
import { useStartBooking } from '@/state/booking';
import { useData } from '@/state/data';
import { brand, display, font, title, useTheme } from '@/theme';
import { activityColor } from '@/theme/colors';

export default function Home() {
  const { club, clubs, user } = useApp();
  const { c } = useTheme();
  const startBooking = useStartBooking();
  const { upcoming } = useData();
  if (!club) return null;
  const next = user ? upcoming.find((b) => b.status !== 'waitlist') : undefined;
  const status = openStatus(club);

  return (
    <TabScreen index={0}>
      <View style={styles.hero}>
        <PitchLines color={brand.onPitch} style={{ right: -160, top: -36, opacity: 0.13 }} />
        <View style={styles.meta}>
          {status.pill ? (
            <View style={styles.pill}>
              <Text style={styles.pillT}>{status.text}</Text>
            </View>
          ) : (
            <>
              {status.live ? <LiveDot /> : null}
              <Text style={styles.metaT}>{status.text}</Text>
            </>
          )}
        </View>
        <Text accessibilityRole="header" adjustsFontSizeToFit numberOfLines={2} style={[display(84, 0.86, { top: 16, bottom: 8 }), styles.name]}>
          {club.name}
        </Text>
        <Text style={styles.city}>
          {user ? `Hi ${user.firstName}. ` : ''}
          {club.city}
        </Text>
        <View style={styles.actions}>
          <Button style={{ flex: 1 }} onPress={() => startBooking('rent-a-field')}>
            Rent a field
          </Button>
          <Button kind="line" style={{ flex: 1 }} onPress={() => startBooking('pickup-soccer')}>
            Join pickup
          </Button>
        </View>
        <Marquee names={clubs.map((x) => x.name)} current={club.name} />
      </View>

      {next ? (
        <View style={styles.sec}>
          <SectionTitle>Your next game</SectionTitle>
          <BookingCard booking={next} />
        </View>
      ) : null}

      <View style={styles.sec}>
        <SectionTitle>{`Play at ${club.name}`}</SectionTitle>
        <View style={styles.tiles}>
          {ACTIVITIES.map((a, i) => (
            <Press
              key={a.id}
              onPress={() => startBooking(a.id)}
              label={`${a.name}. ${a.sub}`}
              style={[styles.tile, { backgroundColor: c.surface, borderColor: c.rule }, i === 0 ? styles.tileWide : styles.tileHalf]}>
              <View style={[styles.blob, { backgroundColor: activityColor(a.color) }]} />
              <View style={[styles.ring, { borderColor: activityColor(a.color) }]} />
              <Text style={[title(i === 0 ? 30 : 23), { color: c.text }]}>{a.name}</Text>
              <Text style={[styles.tileSub, { color: c.text2 }]}>{a.sub}</Text>
            </Press>
          ))}
        </View>
      </View>

      <View style={styles.sec}>
        <SectionTitle>Getting here</SectionTitle>
        <ClubDetails club={club} />
      </View>
    </TabScreen>
  );
}

/** Green "open now" dot with a pulsing ring. */
function LiveDot() {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(p, { toValue: 1, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [p]);
  return (
    <View style={{ width: 8, height: 8 }}>
      <Animated.View
        style={[
          styles.dotRing,
          { opacity: p.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0, 0] }), transform: [{ scale: p.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 3.2, 3.2] }) }] },
        ]}
      />
      <View style={styles.dot} />
    </View>
  );
}

/** Scrolling strip of every club name, the current one in yellow. */
function Marquee({ names, current }: { names: string[]; current: string }) {
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!w) return;
    x.setValue(0);
    const loop = Animated.loop(Animated.timing(x, { toValue: -w / 2, duration: 48000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [w, x]);
  const items = [...names, ...names];
  return (
    <View style={styles.marquee} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={[styles.track, { transform: [{ translateX: x }] }]}>
        {items.map((n, i) => (
          <Text key={i} numberOfLines={1} style={[title(22), styles.mItem, { color: n === current ? brand.yellow : brand.onPitch4 }]}>
            {n.toUpperCase()}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden', backgroundColor: brand.pitch, paddingTop: 8, paddingHorizontal: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 26 },
  metaT: { color: brand.onPitch2, fontFamily: font.semibold, fontSize: 13.5 },
  pill: { height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: brand.yellow, justifyContent: 'center' },
  pillT: { color: brand.ink, fontFamily: font.bold, fontSize: 12.5 },
  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: brand.green },
  dotRing: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: brand.green },
  name: { color: brand.onPitch },
  city: { color: brand.onPitch2, fontFamily: font.regular, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  marquee: { height: 52, marginTop: 24, marginHorizontal: -20, borderTopWidth: 1, borderTopColor: brand.onPitch3, overflow: 'hidden' },
  track: { position: "absolute", left: 0, top: 13, flexDirection: "row", flexWrap: "nowrap" },
  mItem: { paddingHorizontal: 14, flexShrink: 0 },
  sec: { paddingTop: 26, paddingHorizontal: 20 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { minHeight: 132, justifyContent: 'flex-end', paddingTop: 16, paddingHorizontal: 14, paddingBottom: 14, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  tileWide: { width: '100%', minHeight: 150 },
  tileHalf: { width: '48.5%', flexGrow: 1, flexBasis: '40%' },
  blob: { position: 'absolute', top: -30, left: -30, width: 64, height: 64, borderRadius: 32 },
  ring: { position: 'absolute', top: -47, left: -47, width: 98, height: 98, borderRadius: 49, borderWidth: 1.5, opacity: 0.7 },
  tileSub: { marginTop: 6, fontFamily: font.regular, fontSize: 13, lineHeight: 17 },
});
