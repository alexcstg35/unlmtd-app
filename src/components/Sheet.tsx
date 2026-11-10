// Modal sheet chrome: grab handle, big title, close button.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { display, useTheme } from '@/theme';

import { Icon } from './Icon';

/** Close a sheet or modal; opened from a link with nothing behind it, go Home instead. */
export function closeModal() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function Sheet({ title, children }: { title: string; children: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg, paddingTop: Platform.OS === 'android' ? insets.top : 0 }}>
      <View style={styles.grab}>
        <View style={[styles.grabI, { backgroundColor: c.text2 }]} />
      </View>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={[display(38), { color: c.text, flex: 1 }]}>
          {title}
        </Text>
        <Pressable onPress={closeModal} accessibilityRole="button" accessibilityLabel="Close" style={[styles.close, { backgroundColor: c.surface2 }]}>
          <Icon name="close" size={18} color={c.text} />
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 26 + insets.bottom }}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  grab: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  grabI: { width: 42, height: 5, borderRadius: 5, opacity: 0.35 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, paddingHorizontal: 20, paddingBottom: 14 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
