// Brand colors, copied from the prototype's CSS variables.

export const brand = {
  pitch: '#00201b', // deep green: top bar, tab bar, hero, onboarding
  pitch2: '#06302a',
  onPitch: '#f8e6cf', // off-white: logo and text on green
  onPitch2: 'rgba(248,230,207,0.68)',
  onPitch3: 'rgba(248,230,207,0.16)',
  onPitch4: 'rgba(248,230,207,0.38)',

  yellow: '#f3d02c', // field rental
  red: '#f2523b', // pickup
  pink: '#ff95c8',
  blue: '#59a8ff', // camps
  green: '#33d17f', // success
  ink: '#00201b',
} as const;

export type Palette = {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  text2: string;
  rule: string;
  focus: string;
  danger: string;
  knob: string;
};

export const light: Palette = {
  bg: '#f4ede1',
  surface: '#fffaf2',
  surface2: '#e9e0d0',
  text: '#00201b',
  text2: '#4d5f57',
  rule: 'rgba(0,32,27,0.13)',
  focus: '#00201b',
  danger: '#b8321f',
  knob: '#fffaf2',
};

export const dark: Palette = {
  bg: '#011815',
  surface: '#08302a',
  surface2: '#103d35',
  text: '#f8e6cf',
  text2: 'rgba(248,230,207,0.66)',
  rule: 'rgba(248,230,207,0.13)',
  focus: '#f3d02c',
  danger: '#ff8a78',
  knob: '#f8e6cf',
};

export type ActivityColor = 'yellow' | 'red' | 'blue' | 'pink' | 'green';
export const activityColor = (c: ActivityColor) => brand[c];
