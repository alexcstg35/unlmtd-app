// "Getting here" / "Your club" rows: directions, hours, fields, call, email, club page.
import * as Linking from 'expo-linking';

import type { Club } from '@/bond';
import { directionsUrl, fmtTime } from '@/lib/format';

import { Row, Rows } from './ui';

export function ClubDetails({ club: c }: { club: Club }) {
  const rows: React.ComponentProps<typeof Row>[] = [];
  if (c.address) rows.push({ title: c.address, sub: 'Get directions', icon: 'ext', onPress: () => Linking.openURL(directionsUrl(c)) });
  if (c.hours)
    rows.push({
      title: 'Hours',
      sub: `Mon to Fri ${fmtTime(c.hours.weekday[0])}–${fmtTime(c.hours.weekday[1])}\nSat and Sun ${fmtTime(c.hours.weekend[0])}–${fmtTime(c.hours.weekend[1])}`,
    });
  if (c.formats) rows.push({ title: 'Fields', sub: c.formats.join(', ') });
  if (c.phone) rows.push({ title: 'Call the club', sub: c.phone, icon: 'chev', onPress: () => Linking.openURL(`tel:${c.phone!.replace(/[^\d+]/g, '')}`) });
  if (c.email) rows.push({ title: 'Email the club', sub: c.email, icon: 'chev', onPress: () => Linking.openURL(`mailto:${c.email}`) });
  rows.push({ title: 'Club page', sub: c.address ? 'Photos, amenities and parking' : 'Address, hours and contact details', icon: 'ext', onPress: () => Linking.openURL(c.pageUrl) });
  return (
    <Rows>
      {rows.map((r, i) => (
        <Row key={r.title} {...r} first={i === 0} />
      ))}
    </Rows>
  );
}
