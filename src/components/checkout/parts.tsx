// Checkout building blocks: option rows, steppers, form fields, the waiver reader.
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/Icon';
import { brand, font, useTheme } from '@/theme';

export function CoH({ children }: { children: string }) {
  const { c } = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.coH, { color: c.text }]}>
      {children}
    </Text>
  );
}

export function Box({ children, inset }: { children: ReactNode; inset?: boolean }) {
  const { c } = useTheme();
  return <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.rule }, inset && { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }]}>{children}</View>;
}

/** Radio (round) or checkbox (square) option row. */
export function OptRow({ kind, on, title, sub, onPress, first, disabled }: { kind: 'radio' | 'check'; on: boolean; title: string; sub?: string; onPress: () => void; first?: boolean; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={kind === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: on, disabled }}
      style={[styles.opt, !first && { borderTopWidth: 1, borderTopColor: c.rule }, disabled && { opacity: 0.55 }]}>
      {kind === 'radio' ? (
        <View style={[styles.rad, { borderColor: on ? c.text : c.text2, backgroundColor: on ? c.text : 'transparent' }]}>{on ? <View style={[styles.radIn, { backgroundColor: c.surface }]} /> : null}</View>
      ) : (
        <View style={[styles.chk, { borderColor: on ? c.text : c.text2, backgroundColor: on ? c.text : 'transparent' }]}>{on ? <Icon name="check" size={14} strokeWidth={3} color={c.bg} /> : null}</View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.optT, { color: c.text }]}>{title}</Text>
        {sub ? <Text style={[styles.optS, { color: disabled ? c.danger : c.text2 }]}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function AddRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.add, { borderTopColor: c.rule }]}>
      <Icon name="plus" size={15} strokeWidth={2.2} color={c.text2} />
      <Text style={[styles.addT, { color: c.text2 }]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({ value, onChange, min = 0, max = 10, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  const { c } = useTheme();
  const btn = (d: number, t: string, a11y: string) => (
    <Pressable onPress={() => onChange(Math.max(min, Math.min(max, value + d)))} accessibilityRole="button" accessibilityLabel={`${a11y} ${label}`} style={[styles.stepBtn, { backgroundColor: c.surface2 }]}>
      <Text style={[styles.stepBtnT, { color: c.text }]}>{t}</Text>
    </Pressable>
  );
  return (
    <View style={styles.stepper}>
      {btn(-1, '−', 'Fewer')}
      <Text accessibilityLiveRegion="polite" style={[styles.stepV, { color: c.text }]}>
        {value}
      </Text>
      {btn(1, '+', 'More')}
    </View>
  );
}

export function Field({ label, hint, invalid, ...props }: { label: string; hint?: string; invalid?: boolean } & TextInputProps) {
  const { c } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginTop: 12, flex: 1 }}>
      <Text style={[styles.label, { color: c.text2 }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.text2}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[
          styles.input,
          { backgroundColor: props.editable === false ? c.surface2 : c.bg, color: c.text, borderColor: invalid ? c.danger : focus ? c.text : c.rule },
          (invalid || focus) && { borderWidth: 2 },
        ]}
        {...props}
      />
      {hint ? <Text style={[styles.hint, { color: c.text2 }]}>{hint}</Text> : null}
    </View>
  );
}

export function Err({ children }: { children?: string | null }) {
  const { c } = useTheme();
  if (!children) return null;
  return (
    <Text accessibilityRole="alert" style={[styles.err, { color: c.danger }]}>
      {children}
    </Text>
  );
}

export function Callout({ children }: { children: string }) {
  const { c } = useTheme();
  return <Text style={[styles.callout, { backgroundColor: c.surface2, color: c.text }]}>{children}</Text>;
}

export function StatusChip({ kind, label, center }: { kind: 'ok' | 'pend' | 'wait'; label: string; center?: boolean }) {
  const { c } = useTheme();
  const bg = kind === 'ok' ? brand.green : kind === 'pend' ? brand.yellow : c.surface2;
  return (
    <View style={[styles.st, { backgroundColor: bg }, center && { alignSelf: 'center' }]}>
      <Text style={[styles.stT, { color: kind === 'wait' ? c.text : brand.ink }]}>{label}</Text>
    </View>
  );
}

/**
 * One waiver for one person: on file, or the text to scroll through before the
 * "I agree" box unlocks.
 */
export function WaiverBlock({ name, who, text, onFile, agreed, onAgree, first }: { name: string; who?: string; text: string; onFile: boolean; agreed: boolean; onAgree: (v: boolean) => void; first?: boolean }) {
  const { c } = useTheme();
  const [read, setRead] = useState(false);
  const boxH = useRef(0);
  const sep = !first ? { borderTopWidth: 1, borderTopColor: c.rule } : null;

  if (onFile)
    return (
      <View style={[styles.onfile, sep]}>
        <Icon name="check" size={20} color={brand.green} />
        <Text style={[styles.onfileT, { color: c.text }]}>
          {name}: on file{who ? ` for ${who}` : ''}
        </Text>
      </View>
    );

  const full = `${text}\n\n${text}\n\n${text}`;
  return (
    <View style={sep}>
      <View style={styles.wTitle}>
        <Text style={[styles.wTitleT, { color: c.text }]}>
          {name}
          {who ? ` for ${who}` : ''}
        </Text>
        <StatusChip kind="pend" label="Incomplete" />
      </View>
      <ScrollView
        nestedScrollEnabled
        style={[styles.wBox, { backgroundColor: c.bg, borderColor: c.rule }]}
        onLayout={(e) => (boxH.current = e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => {
          if (h <= boxH.current + 8) setRead(true);
        }}
        scrollEventThrottle={64}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 8) setRead(true);
        }}
        accessibilityLabel="Waiver text">
        <Text style={[styles.wText, { color: c.text2 }]}>{full}</Text>
      </ScrollView>
      <Text style={[styles.mini, { color: c.text2 }]}>Scroll to read the full waiver.</Text>
      <Pressable
        disabled={!read}
        onPress={() => onAgree(!agreed)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed, disabled: !read }}
        style={[styles.checkLine, !read && { opacity: 0.5 }]}>
        <View style={[styles.chk, { borderColor: agreed ? c.text : c.text2, backgroundColor: agreed ? c.text : 'transparent' }]}>{agreed ? <Icon name="check" size={14} strokeWidth={3} color={c.bg} /> : null}</View>
        <Text style={[styles.checkLineT, { color: c.text }]}>I have read and agree to the above{who ? ` on behalf of ${who}` : ''}.</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  coH: { marginTop: 26, marginBottom: 10, fontFamily: font.bold, fontSize: 15 },
  box: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingVertical: 12, paddingHorizontal: 16 },
  rad: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radIn: { width: 10, height: 10, borderRadius: 5 },
  chk: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  optT: { fontFamily: font.semibold, fontSize: 16 },
  optS: { marginTop: 2, fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  addT: { fontFamily: font.semibold, fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepBtnT: { fontFamily: font.semibold, fontSize: 20, lineHeight: 22 },
  stepV: { minWidth: 20, textAlign: 'center', fontFamily: font.extrabold, fontSize: 17 },
  label: { marginBottom: 6, fontFamily: font.semibold, fontSize: 13 },
  input: { height: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, fontFamily: font.regular, fontSize: 16 },
  hint: { marginTop: 6, fontFamily: font.regular, fontSize: 12.5 },
  err: { marginTop: 12, fontFamily: font.semibold, fontSize: 13.5 },
  callout: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, overflow: 'hidden', fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  st: { alignSelf: 'flex-start', height: 22, paddingHorizontal: 8, borderRadius: 999, justifyContent: 'center' },
  stT: { fontFamily: font.extrabold, fontSize: 11.5 },
  onfile: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16 },
  onfileT: { flex: 1, fontFamily: font.regular, fontSize: 14.5 },
  wTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 10 },
  wTitleT: { flex: 1, fontFamily: font.bold, fontSize: 14.5 },
  wBox: { maxHeight: 150, marginHorizontal: 16, marginBottom: 4, padding: 12, borderRadius: 12, borderWidth: 1 },
  wText: { fontFamily: font.regular, fontSize: 13, lineHeight: 19.5, paddingBottom: 20 },
  mini: { marginTop: 8, marginHorizontal: 18, marginBottom: 4, fontFamily: font.regular, fontSize: 12.5 },
  checkLine: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 16 },
  checkLineT: { flex: 1, fontFamily: font.regular, fontSize: 14.5, lineHeight: 20 },
});
