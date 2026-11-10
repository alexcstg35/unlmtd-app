// Bond ID sheet: big check-in code for one household member, plus the rest of the household.
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { BondIdRows } from '@/components/BondIdRows';
import { BondQr, useBondId } from '@/components/BondQr';
import { CoH } from '@/components/checkout/parts';
import { Sheet } from '@/components/Sheet';
import { Press } from '@/components/ui';
import { getWalletPassUrl } from '@/server/api';
import { useApp } from '@/state/app';
import { useData } from '@/state/data';
import { useToast } from '@/state/toast';
import { brand, display, font, useTheme } from '@/theme';

const WALLET_APP = Platform.OS === 'android' ? 'Google Wallet' : 'Apple Wallet';

export default function BondId() {
  const { member } = useLocalSearchParams<{ member: string }>();
  const { user } = useApp();
  const { household } = useData();
  const { c } = useTheme();
  const toast = useToast();
  const m = household.find((x) => x.id === member) ?? household[0];
  const code = useBondId(m);
  const [adding, setAdding] = useState(false);

  // The pass is signed by UNLMTD's server (it holds the Apple and Google keys).
  // Apple Wallet: opening the .pkpass link shows iOS's "Add to Wallet" screen.
  // Google Wallet: opening the save link shows Google's add screen.
  async function addToWallet() {
    if (!m || !code || adding) return;
    setAdding(true);
    try {
      const url = await getWalletPassUrl({ bondId: code, name: `${m.firstName} ${m.lastName}`.trim(), platform: Platform.OS === 'android' ? 'android' : 'ios' });
      if (!url) return toast(`Adding to ${WALLET_APP} isn’t set up yet`);
      await Linking.openURL(url);
    } catch {
      toast(`Couldn’t add to ${WALLET_APP}. Try again.`);
    } finally {
      setAdding(false);
    }
  }

  if (!user || !m)
    return (
      <Sheet title="Bond ID">
        <Text style={[styles.body, { color: c.text2 }]}>Sign in to see your Bond ID.</Text>
      </Sheet>
    );

  return (
    <Sheet title="Bond ID">
      <View style={styles.big}>
        <BondQr member={m} size={200} padding={14} />
        <Text style={[display(36, 0.9, { top: 16 }), { color: brand.onPitch, textAlign: 'center' }]}>
          {m.firstName}
          {m.isAccountHolder && user.lastName ? ` ${user.lastName}` : ''}
        </Text>
        {code ? <Text style={styles.code}>{code}</Text> : null}
        <Text style={styles.small}>Scan at the front desk to check in for every booking.</Text>
        <Press onPress={addToWallet} disabled={adding || !code} label={`Add to ${WALLET_APP}`} style={[styles.wallet, (adding || !code) && { opacity: 0.6 }]}>
          <Text style={styles.walletT}>{adding ? 'Adding…' : `Add to ${WALLET_APP}`}</Text>
        </Press>
      </View>
      {household.length > 1 ? (
        <>
          <CoH>Household</CoH>
          <BondIdRows members={household} replace />
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: font.regular, fontSize: 15 },
  big: { alignItems: 'center', paddingVertical: 22, paddingHorizontal: 20, borderRadius: 22, backgroundColor: brand.pitch },
  code: { marginTop: 4, color: brand.onPitch, fontFamily: font.bold, fontSize: 15, letterSpacing: 1 },
  small: { marginTop: 6, color: brand.onPitch2, fontFamily: font.regular, fontSize: 13.5, textAlign: 'center' },
  wallet: { alignSelf: 'stretch', marginTop: 18, height: 50, borderRadius: 12, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  walletT: { color: '#fff', fontFamily: font.bold, fontSize: 16 },
});
