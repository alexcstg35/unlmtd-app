// Dark bar that springs up from the bottom once something is picked.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { money, plural } from '@/lib/format';
import { useApp } from '@/state/app';
import { useBooking, type Selection } from '@/state/booking';
import { brand, font } from '@/theme';

export function SummaryBar() {
  const { selection } = useBooking();
  const { club, user } = useApp();
  const y = useRef(new Animated.Value(selection ? 0 : 1)).current;
  // Keep the last text while the bar slides away.
  const [shown, setShown] = useState<Selection | null>(selection);

  useEffect(() => {
    if (selection) setShown(selection);
    Animated.spring(y, { toValue: selection ? 0 : 1, friction: 7, tension: 70, useNativeDriver: true }).start();
  }, [selection, y]);

  if (!shown || !club) return null;
  const cur = club.currency;
  const a = shown.kind === 'camp' ? shown.title : shown.short;
  const b =
    shown.kind === 'rental'
      ? `${money(shown.price, cur)}${shown.needsApproval ? ', needs approval' : ''}`
      : shown.kind === 'camp'
        ? `${plural(shown.camp!.days.length, 'day')}, ${money(shown.price, cur)} per camper`
        : `${money(shown.price, cur)} per player`;

  const go = () => {
    if (!selection) return;
    if (!user) router.push({ pathname: '/sign-in', params: { note: 'Sign in with your Bond Sports account to finish booking.', next: 'checkout' } });
    else router.push('/checkout');
  };

  return (
    <Animated.View
      pointerEvents={selection ? 'auto' : 'none'}
      accessibilityLiveRegion="polite"
      style={[styles.bar, { transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 160] }) }] }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={styles.a}>
          {a}
        </Text>
        <Text numberOfLines={1} style={styles.b}>
          {b}
        </Text>
      </View>
      <Button style={{ height: 46 }} onPress={go}>
        {shown.kind === 'rental' ? 'Complete booking' : 'Register'}
      </Button>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 18,
    borderRadius: 22,
    backgroundColor: brand.pitch,
    borderWidth: 1,
    borderColor: brand.onPitch3,
    shadowColor: '#001410',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  a: { color: brand.onPitch, fontFamily: font.bold, fontSize: 14.5, lineHeight: 19 },
  b: { color: brand.onPitch2, fontFamily: font.regular, fontSize: 13 },
});
