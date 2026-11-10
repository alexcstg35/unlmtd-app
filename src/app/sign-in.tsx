import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthForm, type AuthMode } from '@/components/AuthForm';
import { closeModal, Sheet } from '@/components/Sheet';
import { useApp } from '@/state/app';
import { useToast } from '@/state/toast';
import { font, useTheme } from '@/theme';

/** Sign in / create account sheet. `?mode=signup` opens on create account; `?note=` shows a reason above the form; `?next=checkout` goes on to checkout. */
export default function SignIn() {
  const params = useLocalSearchParams<{ mode?: AuthMode; note?: string; next?: 'checkout' }>();
  const [mode, setMode] = useState<AuthMode>(params.mode === 'signup' ? 'signup' : 'signin');
  const { setUser } = useApp();
  const { c } = useTheme();
  const toast = useToast();
  return (
    <Sheet title={mode === 'signup' ? 'Create account' : 'Sign in'}>
      {params.note ? <Text style={[styles.note, { backgroundColor: c.surface2, color: c.text }]}>{params.note}</Text> : null}
      <AuthForm
        key={mode}
        mode={mode}
        onSwitchMode={setMode}
        onDone={(p) => {
          setUser(p);
          if (params.next === 'checkout') return router.replace('/checkout');
          closeModal();
          toast(`Signed in as ${p.firstName}`);
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  note: { marginBottom: 4, paddingVertical: 11, paddingHorizontal: 13, borderRadius: 14, overflow: 'hidden', fontFamily: font.semibold, fontSize: 14 },
});
