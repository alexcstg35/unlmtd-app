import { Anton_400Regular } from '@expo-google-fonts/anton';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import type { TextStyle } from 'react-native';

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

/** Big condensed uppercase headline, like `.display` in the prototype. */
export const display = (size: number, lineHeight = 0.9): TextStyle => ({
  fontFamily: font.display,
  fontSize: size,
  lineHeight: Math.round(size * lineHeight + 4),
  textTransform: 'uppercase',
  includeFontPadding: false,
});

/** Section titles and tile names (75% width in the prototype). */
export const title = (size: number): TextStyle => ({
  fontFamily: font.display,
  fontSize: size,
  lineHeight: Math.round(size * 1.08),
  includeFontPadding: false,
});
