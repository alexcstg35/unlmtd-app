// Bond ID check-in code: a real, scannable QR code of the member's Bond ID.
// What the code contains comes from bond.getBondId(); confirm the format with Bond before launch.
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { bond, type Member } from '@/bond';
import { brand } from '@/theme';

/** The member's Bond ID, loaded from Bond. Empty while loading or if it fails. */
export function useBondId(member: Member | undefined) {
  const [id, setId] = useState('');
  useEffect(() => {
    let live = true;
    setId('');
    if (member)
      bond
        .getBondId(member)
        .then((v) => live && setId(v))
        .catch(() => {});
    return () => {
      live = false;
    };
  }, [member]);
  return id;
}

export function BondQr({ member, size, padding }: { member: Member; size: number; padding: number }) {
  const value = useBondId(member);
  const inner = size - padding * 2;
  return (
    <View
      style={{ width: size, height: size, padding, borderRadius: size * 0.09, backgroundColor: brand.onPitch, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="image"
      accessibilityLabel={value ? `Bond ID code for ${member.firstName}` : 'Loading Bond ID'}>
      {value ? <QRCode value={value} size={inner} color={brand.pitch} backgroundColor={brand.onPitch} ecl="M" /> : <ActivityIndicator color={brand.pitch} />}
    </View>
  );
}
