import type { ActivityColor } from '@/theme/colors';

export type ActivityId = 'rent-a-field' | 'pickup-soccer' | 'youth-camp';

export const ACTIVITIES: { id: ActivityId; name: string; sub: string; color: ActivityColor }[] = [
  { id: 'rent-a-field', name: 'Field rental', sub: 'Pick a field and a time. Prices update live, with peak and off-peak rates.', color: 'yellow' },
  { id: 'pickup-soccer', name: 'Pickup', sub: '$10 a game, come solo', color: 'red' },
  { id: 'youth-camp', name: 'Youth camps', sub: 'School’s off, soccer’s on. Ages 4 to 15', color: 'blue' },
];
