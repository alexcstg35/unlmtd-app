// One dark row per household member, with a small Bond ID code. Tap to show it full size.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { Member } from '@/bond';
import { brand, display, font } from '@/theme';

import { BondQr } from './BondQr';
import { Icon } from './Icon';
import { Press } from './ui';

const ageOf = (m: Member) => new Date().getFullYear() - m.birthYear;

export function BondIdRows({ members, replace }: { members: Member[]; replace?: boolean }) {
  return (
    <View style={{ gap: 10 }}>
      {members.map((m) => (
        <Press
          key={m.id}
          label={`Bond ID for ${m.firstName}`}
          onPress={() => (replace ? router.setParams({ member: m.id }) : router.push({ pathname: '/bond-id/[member]', params: { member: m.id } }))}
          style={styles.row}>
          <BondQr member={m} size={64} padding={5} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[display(26, 0.95), { color: brand.onPitch }]}>{m.firstName}</Text>
            <Text style={styles.s}>{m.isAccountHolder ? 'Account holder' : `Age ${ageOf(m)}`}. Tap to show at the front desk</Text>
          </View>
          <Icon name="chev" size={16} color={brand.onPitch} opacity={0.5} />
        </Press>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: brand.pitch, borderWidth: 1, borderColor: brand.onPitch3 },
  s: { color: brand.onPitch2, fontFamily: font.regular, fontSize: 13 },
});
