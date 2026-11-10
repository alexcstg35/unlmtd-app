import { Anton_400Regular } from '@expo-google-fonts/anton';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import { Platform, type TextStyle } from 'react-native';

export const fontAssets = {
  Anton_400Regular,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
};

// The prototype's headlines use Archivo at 62% width, weight 900. That cut isn't
// in @expo-google-fonts/archivo, so headlines use Anton, the prototype's own fallback.
export const font = {
  display: 'Anton_400Regular',
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
} as const;

type Margins = { top?: number; bottom?: number };

// Anton's natural line height is 1.505 × its size (ascent 2409 + descent 674, 2048 units per em).
const ANTON_NATURAL = (2409 + 674) / 2048;

/**
 * Headline text in Anton with a line height tighter than the font's own, as the prototype does.
 *
 * Android and web spread the missing space evenly above and below (CSS half-leading), so the caps
 * sit inside the line. iOS keeps the baseline where it was and trims from the top, which cut off
 * the tops of the letters. On iOS we add that trimmed amount as top padding (so the letters are
 * drawn inside the view) and pull the next thing up by the same amount, so every platform ends up
 * with the same layout.
 *
 * Pass margins here rather than in a separate style, so the iOS correction isn't overwritten.
 */
export function anton(size: number, lineHeight: number, m: Margins = {}): TextStyle {
  const lh = Math.round(lineHeight);
  const natural = size * ANTON_NATURAL;
  const lift = Platform.OS === 'ios' && lh < natural ? Math.ceil((natural - lh) / 2) : 0;
  return {
    fontFamily: font.display,
    fontSize: size,
    lineHeight: lh,
    includeFontPadding: false,
    paddingTop: lift,
    marginTop: m.top ?? 0,
    marginBottom: (m.bottom ?? 0) - lift,
  };
}

/** Big condensed uppercase headline, like `.display` in the prototype. */
export const display = (size: number, lineHeight = 0.9, m?: Margins): TextStyle => ({
  ...anton(size, size * lineHeight + 4, m),
  textTransform: 'uppercase',
});

/** Section titles and tile names (75% width in the prototype). */
export const title = (size: number, m?: Margins): TextStyle => anton(size, size * 1.08, m);
