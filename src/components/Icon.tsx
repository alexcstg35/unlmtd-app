// Line icons copied from the prototype's inline SVGs.
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName = 'home' | 'book' | 'ticket' | 'user' | 'chevDown' | 'chev' | 'back' | 'ext' | 'check' | 'close' | 'search' | 'target' | 'info' | 'lock' | 'plus';

const shapes: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <Path d="M3.5 11 12 4l8.5 7" />
      <Path d="M6 9.5V20h12V9.5" />
      <Path d="M10 20v-5h4v5" />
    </>
  ),
  book: (
    <>
      <Rect x="3.5" y="5" width="17" height="15" rx="3" />
      <Path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  ticket: (
    <>
      <Path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
      <Path d="M14.5 7.5v1.5M14.5 11.25v1.5M14.5 15v1.5" />
    </>
  ),
  user: (
    <>
      <Circle cx="12" cy="8.5" r="3.8" />
      <Path d="M4.5 20c1.3-3.6 4.2-5.4 7.5-5.4s6.2 1.8 7.5 5.4" />
    </>
  ),
  chevDown: <Path d="m6 9 6 6 6-6" />,
  chev: <Path d="m9 6 6 6-6 6" />,
  back: <Path d="m15 6-6 6 6 6" />,
  ext: <Path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  check: <Path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="6.5" />
      <Path d="m16 16 4 4" />
    </>
  ),
  target: (
    <>
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <Circle cx="12" cy="12" r="6" />
      <Circle cx="12" cy="12" r="1.6" />
    </>
  ),
  info: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 11v6M12 7.5v.5" />
    </>
  ),
  lock: (
    <>
      <Rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
};

export function Icon({ name, size = 24, color, strokeWidth = 1.8, opacity }: { name: IconName; size?: number; color: string; strokeWidth?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      {shapes[name]}
    </Svg>
  );
}

/** The faint pitch lines drawn behind hero and club cards. */
export function PitchLines({ color, size = 330, style }: { color: string; size?: number; style?: object }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300" fill="none" stroke={color} strokeWidth={1.2} style={[{ position: 'absolute' }, style]} pointerEvents="none">
      <Rect x="1" y="1" width="298" height="298" />
      <Path d="M150 1v298" />
      <Circle cx="150" cy="150" r="62" />
      <Circle cx="150" cy="150" r="2.5" />
    </Svg>
  );
}
