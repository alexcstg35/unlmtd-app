// Small pieces of the booking screens: step headings, segmented control, selection brackets, notes.
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/Icon';
import { brand, display, font, useTheme } from '@/theme';

export function Step({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.step, { color: c.text }, style]}>
      {children}
    </Text>
  );
}

/** Pill segmented control (Duration, Appearance). */
export function Seg({ label, values, value, onChange }: { label: string; values: string[]; value: number; onChange: (i: number) => void }) {
  const { c } = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: c.surface2 }]} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {values.map((v, i) => {
        const on = i === value;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(i)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[styles.segBtn, on && { backgroundColor: c.surface, shadowColor: '#001410', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }]}>
            <Text style={[styles.segT, { color: on ? c.text : c.text2 }]}>{v}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Corner brackets that snap onto the selected day, field or session,
 * like the prototype's `.sel::before/::after`.
 */
export function Bracket({ on, children, style }: { on: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const a = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (on) {
      a.setValue(0);
      Animated.spring(a, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }).start();
    }
  }, [on, a]);
  const corner = (dir: 1 | -1) => ({
    opacity: a,
    transform: [
      { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [8 * dir, 0] }) },
      { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8 * dir, 0] }) },
    ],
  });
  return (
    <View style={style}>
      {children}
      {on ? (
        <>
          <Animated.View pointerEvents="none" style={[styles.corner, styles.tl, { borderColor: c.text }, corner(-1)]} />
          <Animated.View pointerEvents="none" style={[styles.corner, styles.br, { borderColor: c.text }, corner(1)]} />
        </>
      ) : null}
    </View>
  );
}

export function Note({ children }: { children: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.note, { backgroundColor: c.surface2 }]}>
      <Icon name="info" size={18} color={c.text2} />
      <Text style={[styles.noteT, { color: c.text2 }]}>{children}</Text>
    </View>
  );
}

export function EmptyDay({ children }: { children: string }) {
  const { c } = useTheme();
  return <Text style={[styles.emptyDay, { borderColor: c.rule, color: c.text2 }]}>{children}</Text>;
}

/** Dark info card at the top of pickup and camps. */
export function InfoCard({ title, ages, children }: { title: string; ages: string; children: ReactNode }) {
  return (
    <View style={styles.info}>
      <Text accessibilityRole="header" style={[display(34), { color: brand.onPitch }]}>
        {title}
      </Text>
      <View style={styles.ages}>
        <Text style={styles.agesT}>{ages}</Text>
      </View>
      {children}
    </View>
  );
}
export const infoText = { marginTop: 6, fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: brand.onPitch2 };

/** Date block used on session and camp cards. */
export function DateBlock({ day, month }: { day: number; month: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.dateBlock, { backgroundColor: c.surface2 }]}>
      <Text style={[styles.dateB, { color: c.text }]}>{day}</Text>
      <Text style={[styles.dateS, { color: c.text2 }]}>{month}</Text>
    </View>
  );
}

export function PeakTag() {
  const { c } = useTheme();
  return (
    <View style={styles.peak}>
      <Text style={[styles.peakT, { color: c.danger }]}>PEAK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { marginTop: 24, marginBottom: 10, marginHorizontal: 20, fontFamily: font.bold, fontSize: 15 },
  seg: { flexDirection: 'row', padding: 4, borderRadius: 999 },
  segBtn: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999, paddingHorizontal: 6 },
  segT: { fontFamily: font.semibold, fontSize: 14 },
  corner: { position: 'absolute', width: 11, height: 11 },
  tl: { top: -5, left: -5, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
  br: { bottom: -5, right: -5, borderBottomWidth: 2.5, borderRightWidth: 2.5 },
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 14, marginHorizontal: 20, paddingVertical: 11, paddingHorizontal: 13, borderRadius: 14 },
  noteT: { flex: 1, fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  emptyDay: { marginTop: 6, marginHorizontal: 20, paddingVertical: 22, paddingHorizontal: 18, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', fontFamily: font.regular, fontSize: 14.5, lineHeight: 20 },
  info: { marginTop: 14, marginHorizontal: 20, padding: 16, borderRadius: 18, backgroundColor: brand.pitch, borderWidth: 1, borderColor: brand.onPitch3 },
  ages: { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: brand.onPitch },
  agesT: { color: brand.pitch, fontFamily: font.extrabold, fontSize: 12 },
  dateBlock: { width: 58, height: 58, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateB: { fontFamily: font.display, fontSize: 24, lineHeight: 26 },
  dateS: { fontFamily: font.bold, fontSize: 11.5 },
  peak: { marginLeft: 6, paddingVertical: 1, paddingHorizontal: 6, borderRadius: 6, backgroundColor: 'rgba(242,82,59,0.14)' },
  peakT: { fontFamily: font.extrabold, fontSize: 10.5, letterSpacing: 0.2 },
});
