import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { brand, dark, light, type Palette } from './colors';

export type ThemePref = 'system' | 'light' | 'dark';

type Theme = { scheme: 'light' | 'dark'; c: Palette; brand: typeof brand };

const ThemeContext = createContext<Theme>({ scheme: 'light', c: light, brand });

export function ThemeProvider({ pref, children }: { pref: ThemePref; children: ReactNode }) {
  const system = useColorScheme();
  const scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  const value = useMemo(() => ({ scheme, c: scheme === 'dark' ? dark : light, brand }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

export { brand } from './colors';
export { display, font, title } from './fonts';
