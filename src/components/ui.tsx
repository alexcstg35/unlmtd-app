// Small shared pieces: logo, buttons, rows, page heads.
import { useRef, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { brand, display, font, title, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';

const LOGO = require('../../assets/logo-off-white.png');
const LOGO_RATIO = 1323 / 588;

export function Logo({ height, color = brand.onPitch }: { height: number; color?: string }) {
  return (
    <Image
      source={LOGO}
      accessibilityRole="image"
      accessibilityLabel="UNLMTD Soccer"
      style={{ height, width: height * LOGO_RATIO, tintColor: color }}
      resizeMode="contain"
    />
  );
}

/** Pressable that shrinks slightly on press, like `.btn:active{transform:scale(.97)}`. */
export function Press({ onPress, style, children, disabled, label, role = 'button', selected }: {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  disabled?: boolean;
  label?: string;
  role?: 'button' | 'link' | 'tab' | 'switch';
  selected?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.timing(scale, { toValue: v, duration: 120, useNativeDriver: true }).start();
  // Placement (flex, width, margins, alignSelf) goes on the Pressable so it sizes in its parent;
  // the look goes on the inner view that scales.
  const { flex, flexGrow, flexBasis, flexShrink, width, alignSelf, margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical, ...look } = StyleSheet.flatten(style) ?? {};
  const outer = { flex, flexGrow, flexBasis, flexShrink, width, alignSelf, margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      style={outer}>
      <Animated.View style={[look, { flexGrow: 1, transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

type BtnKind = 'yellow' | 'line' | 'solid' | 'ghost';

export function Button({ kind = 'yellow', children, onPress, busy, disabled, style, small }: {
  kind?: BtnKind;
  children: string;
  onPress?: () => void;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const { c } = useTheme();
  const look: Record<BtnKind, { bg: string; fg: string; border?: string }> = {
    yellow: { bg: brand.yellow, fg: brand.ink },
    line: { bg: 'transparent', fg: brand.onPitch, border: brand.onPitch4 },
    solid: { bg: c.text, fg: c.bg },
    ghost: { bg: c.surface2, fg: c.text },
  };
  const l = look[kind];
  return (
    <Press
      onPress={onPress}
      disabled={disabled || busy}
      label={children}
      style={[
        styles.btn,
        small && { height: 40, paddingHorizontal: 16 },
        { backgroundColor: l.bg, opacity: disabled || busy ? 0.6 : 1 },
        l.border ? { borderWidth: 1.5, borderColor: l.border } : null,
        style,
      ]}>
      {busy ? <ActivityIndicator size="small" color={l.fg} /> : null}
      <Text style={[styles.btnText, small && { fontSize: 14 }, { color: l.fg }]}>{children}</Text>
    </Press>
  );
}

export function PageHead({ title: t, children }: { title: string; children?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingTop: 22, paddingHorizontal: 20, paddingBottom: 2 }}>
      <Text accessibilityRole="header" style={[display(48), { color: c.text }]}>
        {t}
      </Text>
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  const { c } = useTheme();
  return (
    <Text accessibilityRole="header" style={[title(27, { bottom: 14 }), { color: c.text }]}>
      {children}
    </Text>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return <View style={[styles.rows, { backgroundColor: c.surface, borderColor: c.rule }]}>{children}</View>;
}

export function Row({ title: t, sub, onPress, icon, first, danger, right }: {
  title: string;
  sub?: string;
  onPress?: () => void;
  icon?: IconName | null;
  first?: boolean;
  danger?: boolean;
  right?: ReactNode;
}) {
  const { c } = useTheme();
  const body = (
    <View style={[styles.row, !first && { borderTopWidth: 1, borderTopColor: c.rule }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rowT, { color: danger ? c.danger : c.text }]}>{t}</Text>
        {sub ? <Text style={[styles.rowS, { color: c.text2 }]}>{sub}</Text> : null}
      </View>
      {right}
      {icon ? <Icon name={icon} size={16} color={c.text} opacity={0.45} /> : null}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={sub ? `${t}. ${sub}` : t}>
      {({ pressed }) => <View style={{ opacity: pressed ? 0.6 : 1 }}>{body}</View>}
    </Pressable>
  ) : (
    body
  );
}

export function BondBadge({ label = 'Bond Sports', onPitch }: { label?: string; onPitch?: boolean }) {
  const { c } = useTheme();
  const fg = onPitch ? brand.onPitch : c.text;
  return (
    <View style={[styles.badge, onPitch ? { backgroundColor: brand.pitch2, borderWidth: 1, borderColor: brand.onPitch3 } : { backgroundColor: c.surface2 }]}>
      <Icon name="lock" size={13} color={fg} />
      <Text style={[styles.badgeT, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { height: 50, paddingHorizontal: 20, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontFamily: font.bold, fontSize: 15 },
  rows: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 14, paddingHorizontal: 16 },
  rowT: { fontFamily: font.semibold, fontSize: 16 },
  rowS: { fontFamily: font.regular, fontSize: 13.5, marginTop: 2, lineHeight: 19 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 24, paddingHorizontal: 9, borderRadius: 999, alignSelf: 'flex-start' },
  badgeT: { fontFamily: font.bold, fontSize: 12 },
});
