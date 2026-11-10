import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font, useTheme } from '@/theme';

const Ctx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

/** Small pill message at the bottom, like the prototype's toast. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState('');
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(
    (m: string) => {
      setMsg(m);
      clearTimeout(timer.current);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      }, 2600);
    },
    [anim],
  );
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <Animated.View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            bottom: insets.bottom + 96,
            backgroundColor: c.text,
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          },
        ]}>
        <Text style={[styles.text, { color: c.bg }]}>{msg}</Text>
      </Animated.View>
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', alignSelf: 'center', maxWidth: '88%', paddingVertical: 11, paddingHorizontal: 16, borderRadius: 999, zIndex: 100 },
  text: { fontFamily: font.semibold, fontSize: 14, textAlign: 'center' },
});
