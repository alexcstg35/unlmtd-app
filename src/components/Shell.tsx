// App chrome: top bar with club pill, bottom tab bar, tab-screen enter animation, launch splash.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/state/app';
import { useData } from '@/state/data';
import { brand, display, font, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Logo } from './ui';

export const easeOut = Easing.bezier(0.2, 0.8, 0.2, 1);

export function TopBar() {
  const { club } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topbar, { paddingTop: insets.top + 11 }]}>
      <Logo height={30} />
      <Pressable onPress={() => router.push('/switch-club')} accessibilityRole="button" accessibilityLabel={`Change club. Current club: ${club?.name ?? 'none'}`} style={styles.pill}>
        <View style={styles.dot} />
        <Text numberOfLines={1} style={styles.pillT}>
          {club?.name ?? 'Choose club'}
        </Text>
        <Icon name="chevDown" size={15} color={brand.onPitch} opacity={0.7} />
      </Pressable>
    </View>
  );
}

export const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'book', label: 'Book', icon: 'book' },
  { name: 'bookings', label: 'Bookings', icon: 'ticket' },
  { name: 'account', label: 'Account', icon: 'user' },
];

function TabButton({ label, icon, active, onPress, badge }: { label: string; icon: IconName; active: boolean; onPress: () => void; badge?: number }) {
  const bar = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(bar, { toValue: active ? 1 : 0, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [active, bar]);
  const color = active ? brand.onPitch : brand.onPitch2;
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={badge ? `${label}, ${badge} upcoming` : label} style={styles.tab}>
      <Animated.View style={[styles.tabBar, { transform: [{ scaleX: bar }] }]} />
      <Icon name={icon} size={24} color={color} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeT}>{badge}</Text>
        </View>
      ) : null}
      <Text style={[styles.tabT, { color }]}>{label}</Text>
    </Pressable>
  );
}

/** Bottom tab bar. Receives the active route name and a navigate function from the Tabs layout. */
export function TabBar({ active, onSelect }: { active: string; onSelect: (name: string) => void }) {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { upcoming } = useData();
  const count = user ? upcoming.filter((b) => b.status !== 'waitlist').length : 0;
  return (
    <View accessibilityRole="tablist" style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {TABS.map((t) => (
        <TabButton key={t.name} label={t.label} icon={t.icon} active={active === t.name} onPress={() => onSelect(t.name)} badge={t.name === 'bookings' ? count : undefined} />
      ))}
    </View>
  );
}

let lastTab = 0;

/** Scrollable tab screen that slides in from the side of the tab you came from. */
export function TabScreen({ index, children, ...rest }: { index: number; children: ReactNode } & ScrollViewProps) {
  const { c } = useTheme();
  const anim = useRef(new Animated.Value(1)).current;
  const dir = useRef(1);

  useFocusEffect(
    useCallback(() => {
      if (index === lastTab) return;
      dir.current = index > lastTab ? 1 : -1;
      lastTab = index;
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 340, easing: easeOut, useNativeDriver: true }).start();
    }, [index, anim]),
  );

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        opacity: anim,
        transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [18 * dir.current, 0] }) }],
      }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...rest}>
        {children}
      </ScrollView>
    </Animated.View>
  );
}

/** Launch splash: logo wipes up, "Make it last." fades in, then the panel slides away. */
export function Splash({ onDone }: { onDone: () => void }) {
  const reveal = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(0)).current;
  const [h, setH] = useState(800);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(out, { toValue: 1, duration: 650, easing: Easing.bezier(0.7, 0, 0.2, 1), useNativeDriver: true }).start(() => onDone());
  }, [out, onDone]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) {
        reveal.setValue(1);
        tag.setValue(1);
        t = setTimeout(finish, 250);
        return;
      }
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(reveal, { toValue: 1, duration: 800, easing: easeOut, useNativeDriver: true }),
      ]).start();
      Animated.sequence([Animated.delay(850), Animated.timing(tag, { toValue: 1, duration: 450, useNativeDriver: true })]).start();
      t = setTimeout(finish, 1700);
    });
    return () => clearTimeout(t);
  }, [reveal, tag, finish]);

  const LOGO_H = 260 / (1323 / 588);
  return (
    <Animated.View
      onLayout={(e) => setH(e.nativeEvent.layout.height)}
      style={[StyleSheet.absoluteFill, styles.splash, { transform: [{ translateY: out.interpolate({ inputRange: [0, 1], outputRange: [0, -h] }) }] }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Pressable onPress={finish} style={styles.splashIn}>
        {/* Clip box: the logo rises into view from below, like the CSS clip-path wipe. */}
        <View style={{ height: LOGO_H, overflow: 'hidden' }}>
          <Animated.View style={{ transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [LOGO_H + 16, 0] }) }] }}>
            <Logo height={LOGO_H} />
          </Animated.View>
        </View>
        <Animated.Text style={[display(26, 1), styles.splashTag, { opacity: tag }]}>Make it last.</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 11, paddingLeft: 18, paddingRight: 14, backgroundColor: brand.pitch },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 38, maxWidth: 220, paddingLeft: 14, paddingRight: 12, borderRadius: 999, borderWidth: 1, borderColor: brand.onPitch3, backgroundColor: brand.pitch2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand.yellow },
  pillT: { flexShrink: 1, color: brand.onPitch, fontFamily: font.semibold, fontSize: 14 },
  tabbar: { flexDirection: 'row', backgroundColor: brand.pitch, borderTopWidth: 1, borderTopColor: brand.onPitch3, paddingHorizontal: 6 },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 12, paddingBottom: 6 },
  tabBar: { position: 'absolute', top: 0, width: 24, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: brand.yellow },
  tabT: { fontFamily: font.semibold, fontSize: 11.5 },
  badge: { position: 'absolute', top: 7, left: '50%', marginLeft: 6, minWidth: 17, height: 17, paddingHorizontal: 5, borderRadius: 999, backgroundColor: brand.yellow, alignItems: 'center', justifyContent: 'center' },
  badgeT: { color: brand.ink, fontFamily: font.extrabold, fontSize: 10.5, lineHeight: 13 },
  splash: { zIndex: 50, backgroundColor: brand.pitch, alignItems: 'center', justifyContent: 'center' },
  splashIn: { alignItems: 'center' },
  splashTag: { marginTop: 18, color: brand.yellow },
});
