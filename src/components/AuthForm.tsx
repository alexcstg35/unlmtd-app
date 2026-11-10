// Bond Sports sign-in / create-account form. The password goes straight to Bond and is never saved.
import * as Linking from 'expo-linking';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { bond, BOND_MODE, type Profile } from '@/bond';
import { capitalize } from '@/lib/format';
import { useToast } from '@/state/toast';
import { brand, font, useTheme } from '@/theme';

import { Icon } from './Icon';
import { BondBadge, Button } from './ui';

export type AuthMode = 'signin' | 'signup';

export function AuthForm({ mode, onPitch, onSwitchMode, onDone }: { mode: AuthMode; onPitch?: boolean; onSwitchMode: (m: AuthMode) => void; onDone: (p: Profile) => void }) {
  const { c } = useTheme();
  const toast = useToast();
  const sign = mode === 'signin';
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState<{ field?: string; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const refs = { first: useRef<TextInputInstance>(null), last: useRef<TextInputInstance>(null), email: useRef<TextInputInstance>(null), password: useRef<TextInputInstance>(null) };

  const col = onPitch
    ? { text: brand.onPitch, text2: brand.onPitch2, field: brand.pitch2, rule: brand.onPitch3, focus: brand.yellow, err: '#ff9d8c' }
    : { text: c.text, text2: c.text2, field: c.surface, rule: c.rule, focus: c.text, err: c.danger };

  const bad = (field: keyof typeof refs | undefined, msg: string) => {
    setErr({ field, msg });
    if (field) refs[field].current?.focus();
  };

  async function submit() {
    setErr(null);
    const e = email.trim();
    const f = capitalize(first.trim());
    const l = capitalize(last.trim());
    if (!sign && !f) return bad('first', 'Add your first name.');
    if (!sign && !l) return bad('last', 'Add your last name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return bad('email', 'Enter a valid email address.');
    if (!sign && pw.length < 8) return bad('password', 'Use at least 8 characters for your password.');
    if (sign && !pw) return bad('password', 'Enter your password.');
    if (!sign && !terms) return bad(undefined, 'Accept the terms to create your account.');
    setBusy(true);
    try {
      const p = sign ? await bond.signIn(e, pw) : await bond.signUp({ firstName: f, lastName: l, email: e, password: pw });
      setPw('');
      onDone(p);
    } catch (x) {
      setErr({ msg: x instanceof Error ? x.message : 'Something went wrong. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    const e = email.trim();
    if (!e) return toast('Enter your email first');
    await bond.requestPasswordReset(e).catch(() => {});
    toast(`Bond is emailing a reset link to ${e}`);
  }

  const field = (key: keyof typeof refs, label: string, props: TextInputProps, extra?: React.ReactNode, hint?: string) => {
    const invalid = err?.field === key;
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: col.text2 }]}>{label}</Text>
        <View>
          <TextInput
            ref={refs[key]}
            accessibilityLabel={label}
            placeholderTextColor={col.text2}
            style={[styles.input, { backgroundColor: col.field, borderColor: invalid ? col.err : col.rule, color: col.text }, invalid && { borderWidth: 2 }, extra ? { paddingRight: 70 } : null]}
            {...props}
          />
          {extra}
        </View>
        {hint ? <Text style={[styles.hint, { color: col.text2 }]}>{hint}</Text> : null}
      </View>
    );
  };

  return (
    <View>
      <View style={{ marginBottom: 4 }}>
        <BondBadge label={sign ? 'Sign in with Bond Sports' : 'New Bond Sports account'} onPitch={onPitch} />
      </View>
      {!sign ? (
        <View style={styles.two}>
          <View style={{ flex: 1 }}>{field('first', 'First name', { value: first, onChangeText: setFirst, autoComplete: 'given-name', textContentType: 'givenName', returnKeyType: 'next', onSubmitEditing: () => refs.last.current?.focus() })}</View>
          <View style={{ flex: 1 }}>{field('last', 'Last name', { value: last, onChangeText: setLast, autoComplete: 'family-name', textContentType: 'familyName', returnKeyType: 'next', onSubmitEditing: () => refs.email.current?.focus() })}</View>
        </View>
      ) : null}
      {field('email', 'Email', { value: email, onChangeText: setEmail, keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false, autoComplete: 'email', textContentType: 'emailAddress', returnKeyType: 'next', onSubmitEditing: () => refs.password.current?.focus() })}
      {field(
        'password',
        'Password',
        { value: pw, onChangeText: setPw, secureTextEntry: !showPw, autoCapitalize: 'none', autoComplete: sign ? 'current-password' : 'new-password', textContentType: sign ? 'password' : 'newPassword', returnKeyType: 'go', onSubmitEditing: submit },
        <Pressable onPress={() => setShowPw(!showPw)} accessibilityRole="button" accessibilityLabel={showPw ? 'Hide password' : 'Show password'} style={styles.pwToggle}>
          <Text style={[styles.pwToggleT, { color: col.text2 }]}>{showPw ? 'Hide' : 'Show'}</Text>
        </Pressable>,
        sign ? undefined : 'At least 8 characters',
      )}
      {sign ? (
        <Pressable onPress={forgot} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 4, marginTop: 8 }}>
          <Text style={[styles.link, { color: col.text }]}>Forgot password?</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => setTerms(!terms)} accessibilityRole="checkbox" accessibilityState={{ checked: terms }} style={styles.checkRow}>
          <View style={[styles.box, { borderColor: terms ? (onPitch ? brand.yellow : c.text) : col.text2, backgroundColor: terms ? (onPitch ? brand.yellow : c.text) : 'transparent' }]}>
            {terms ? <Icon name="check" size={14} strokeWidth={3} color={onPitch ? brand.ink : c.bg} /> : null}
          </View>
          <Text style={[styles.checkT, { color: col.text }]}>
            I agree to the{' '}
            <Text style={styles.underline} onPress={() => Linking.openURL('https://bondsports.co/terms')}>
              Bond Sports terms
            </Text>{' '}
            and the{' '}
            <Text style={styles.underline} onPress={() => Linking.openURL('https://unlmtdsoccer.com/en/privacy-policy')}>
              UNLMTD privacy policy
            </Text>
            .
          </Text>
        </Pressable>
      )}
      {err ? (
        <Text accessibilityRole="alert" style={[styles.err, { color: col.err }]}>
          {err.msg}
        </Text>
      ) : null}
      <Button style={{ marginTop: 18 }} busy={busy} onPress={submit}>
        {busy ? (sign ? 'Signing in' : 'Creating account') : sign ? 'Sign in' : 'Create account'}
      </Button>
      <Button kind={onPitch ? 'line' : 'ghost'} style={{ marginTop: 10 }} onPress={() => { setErr(null); onSwitchMode(sign ? 'signup' : 'signin'); }}>
        {sign ? 'Create a Bond account' : 'I already have a Bond account'}
      </Button>
      <Text style={[styles.foot, { color: col.text2 }]}>
        {sign ? 'Booked at UNLMTD before? You already have a Bond account, using the email you booked with.' : 'Your Bond account works in this app, on unlmtdsoccer.com and at the front desk.'}
        {BOND_MODE === 'mock' ? '\nSample mode: any email and password work, and nothing is sent anywhere.' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  two: { flexDirection: 'row', gap: 10 },
  field: { marginTop: 12 },
  label: { marginBottom: 6, fontFamily: font.semibold, fontSize: 13 },
  input: { height: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, fontFamily: font.regular, fontSize: 16 },
  hint: { marginTop: 6, fontFamily: font.regular, fontSize: 12.5 },
  pwToggle: { position: 'absolute', right: 6, top: 6, height: 38, paddingHorizontal: 10, justifyContent: 'center' },
  pwToggleT: { fontFamily: font.bold, fontSize: 13.5 },
  link: { fontFamily: font.semibold, fontSize: 14, textDecorationLine: 'underline' },
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 14 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkT: { flex: 1, fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  underline: { textDecorationLine: 'underline' },
  err: { marginTop: 12, fontFamily: font.semibold, fontSize: 13.5 },
  foot: { marginTop: 18, fontFamily: font.regular, fontSize: 12.5, lineHeight: 19 },
});
