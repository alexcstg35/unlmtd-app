// First launch: pick a home club → confirm it → sign in, create a Bond account, or browse first.
import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthForm, type AuthMode } from '@/components/AuthForm';
import { ClubList } from '@/components/ClubList';
import { easeOut } from '@/components/Shell';
import { Button, Logo } from '@/components/ui';
import { useApp } from '@/state/app';
import { useToast } from '@/state/toast';
import { brand, display, font } from '@/theme';

type Step = 'pick' | 'done' | 'auth';

export default function Onboarding() {
  const { clubs, setClub, user, setUser } = useApp();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('pick');
  const [pending, setPending] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>('signin');
  const picked = clubs.find((c) => c.id === pending);

  // Saving the club flips the root guard, which swaps this screen for the tabs.
  const finish = () => {
    if (pending) setClub(pending);
  };

  const onContinue = () => {
    if (user) return finish();
    setMode('signin');
    setStep('auth');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {step === 'pick' ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 28 }} stickyHeaderIndices={[]}>
          <View style={styles.head}>
            <Logo height={36} />
            <Text accessibilityRole="header" style={[display(64, 0.86, { top: 26, bottom: 12 }), styles.titleColor]}>
              Where do you play?
            </Text>
            <Text style={styles.sub}>Pick your home club. The app opens there every time, and you can switch whenever you play somewhere else.</Text>
          </View>
          <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
            <ClubList
              clubs={clubs}
              onPitch
              onPick={(id) => {
                setPending(id);
                setStep('done');
              }}
            />
          </View>
        </ScrollView>
      ) : null}

      {step === 'done' && picked ? (
        <View style={styles.done}>
          <Text style={styles.kicker}>Your home club</Text>
          <Framed name={picked.name} />
          <Text style={styles.city}>{picked.openingSoon ? `${picked.city}. Opening soon.` : picked.city}</Text>
          <Button style={{ alignSelf: 'stretch' }} onPress={onContinue}>
            Continue
          </Button>
          <Button kind="line" style={{ alignSelf: 'stretch', marginTop: 10 }} onPress={() => setStep('pick')}>
            Pick a different club
          </Button>
          <Text style={styles.foot}>Switch clubs anytime from the top of the app.</Text>
        </View>
      ) : null}

      {step === 'auth' ? (
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.head}>
            <Logo height={36} />
            <Text accessibilityRole="header" style={[display(60, 0.86, { top: 22, bottom: 12 }), styles.titleColor]}>
              {mode === 'signup' ? 'Create your account' : 'Sign in to book'}
            </Text>
            <Text style={styles.sub}>
              {mode === 'signup'
                ? 'One Bond Sports account for booking, checking in and managing your household.'
                : 'UNLMTD bookings run on Bond Sports. If you’ve booked with us before, you already have a Bond account.'}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
            <AuthForm
              key={mode}
              mode={mode}
              onPitch
              onSwitchMode={setMode}
              onDone={(p) => {
                setUser(p);
                toast(`Welcome, ${p.firstName}`);
                finish();
              }}
            />
          </View>
          <Pressable onPress={finish} accessibilityRole="button" style={styles.skip}>
            <Text style={styles.skipT}>Browse first, sign in later</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/** Club name with yellow corner brackets that snap in, and the name rising into place. */
function Framed({ name }: { name: string }) {
  const snap = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    snap.setValue(0);
    rise.setValue(0);
    Animated.parallel([
      Animated.sequence([Animated.delay(100), Animated.spring(snap, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true })]),
      Animated.timing(rise, { toValue: 1, duration: 550, easing: easeOut, useNativeDriver: true }),
    ]).start();
  }, [name, snap, rise]);

  const corner = (tl: boolean) => ({
    opacity: snap,
    transform: [
      { translateX: snap.interpolate({ inputRange: [0, 1], outputRange: [tl ? -20 : 20, 0] }) },
      { translateY: snap.interpolate({ inputRange: [0, 1], outputRange: [tl ? -20 : 20, 0] }) },
    ],
  });

  return (
    <View style={styles.framed}>
      <Animated.View style={[styles.corner, styles.tl, corner(true)]} />
      <Animated.View style={[styles.corner, styles.br, corner(false)]} />
      <View style={{ overflow: 'hidden' }}>
        <Animated.Text
          accessibilityRole="header"
          style={[display(76, 0.86), { color: brand.onPitch }, { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [90, 0] }) }] }]}>
          {name}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.pitch },
  head: { paddingTop: 22, paddingHorizontal: 20 },
  titleColor: { color: brand.onPitch },
  sub: { maxWidth: 340, color: brand.onPitch2, fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  done: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingVertical: 28, paddingHorizontal: 24 },
  kicker: { color: brand.onPitch2, fontFamily: font.semibold, fontSize: 16 },
  framed: { marginTop: 16, marginBottom: 10, paddingTop: 16, paddingHorizontal: 18, paddingBottom: 12, maxWidth: '100%' },
  corner: { position: 'absolute', width: 26, height: 26, borderColor: brand.yellow },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  city: { marginBottom: 26, color: brand.onPitch2, fontFamily: font.regular, fontSize: 15 },
  foot: { marginTop: 18, color: brand.onPitch2, fontFamily: font.regular, fontSize: 13 },
  skip: { alignSelf: 'center', marginTop: 6, marginBottom: 26, padding: 10 },
  skipT: { color: brand.onPitch, fontFamily: font.semibold, fontSize: 15, textDecorationLine: 'underline' },
});
