// Account tab: Bond profile, home club, Bond ID, household, saved cards, club details,
// notifications, appearance, sign out, first-launch reset and account deletion.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BOND_ACCOUNT_URL, bond, openBondPage, WEB_MODE } from '@/bond';
import { BondIdRows } from '@/components/BondIdRows';
import { AddChildForm } from '@/components/checkout/AddChildForm';
import { AddRow } from '@/components/checkout/parts';
import { ClubDetails } from '@/components/ClubDetails';
import { PitchLines } from '@/components/Icon';
import { TabScreen } from '@/components/Shell';
import { BondBadge, Button, PageHead, Row, Rows, SectionTitle } from '@/components/ui';
import { ensurePermission, supported } from '@/lib/notifications';
import { useApp, type NotifPrefs } from '@/state/app';
import { useData } from '@/state/data';
import { useToast } from '@/state/toast';
import { brand, display, font, useTheme, type ThemePref } from '@/theme';

export default function Account() {
  const { club, user, setUser, setClub, notif, setNotif, themePref, setThemePref } = useApp();
  const { c } = useTheme();
  const toast = useToast();
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const { household, waiverCount, cards, refresh } = useData();

  // Leaving the tab disarms the delete button, like the prototype's re-render.
  useFocusEffect(useCallback(() => () => setDeleteArmed(false), []));

  if (!club) return null;

  const signOut = async () => {
    await bond.signOut().catch(() => {});
    setUser(null);
  };

  const homeRow = (
    <View style={styles.homeRow}>
      <View>
        <Text style={styles.k2}>Home club</Text>
        <Text style={[display(26, 1), { color: brand.onPitch }]}>{club.name}</Text>
      </View>
      <Button kind="line" small onPress={() => router.push('/switch-club')}>
        Switch
      </Button>
    </View>
  );

  const toggle = (k: keyof NotifPrefs, t: string, s: string, first?: boolean) => (
    <Row
      key={k}
      first={first}
      title={t}
      sub={s}
      right={
        <Toggle
          on={notif[k]}
          label={t}
          onChange={async (v) => {
            // Turning one on asks for permission the first time.
            if (v && supported && !(await ensurePermission())) return toast('Notifications are off for UNLMTD. Turn them on in Settings.');
            setNotif({ ...notif, [k]: v });
          }}
        />
      }
    />
  );

  return (
    <TabScreen index={3}>
      <PageHead title="Account" />

      <View style={styles.card}>
        <PitchLines color={brand.onPitch} style={{ right: -200, top: -70, opacity: 0.1 }} />
        {WEB_MODE ? (
          <>
            <Text style={styles.k}>UNLMTD bookings run on Bond Sports</Text>
            <Text accessibilityRole="header" style={[display(58, 0.86, { top: 12, bottom: 6 }), { color: brand.onPitch }]}>
              Your account
            </Text>
            <Text style={styles.cText}>Your profile, family members, bookings, waivers and payment methods are all in your Bond Sports account.</Text>
            <Button onPress={() => openBondPage(BOND_ACCOUNT_URL)}>Open my Bond account</Button>
          </>
        ) : user ? (
          <>
            <View style={styles.profile}>
              <View style={styles.avatar}>
                <Text style={[display(24, 1), { color: brand.ink }]}>{(user.firstName[0] ?? '') + (user.lastName[0] ?? '')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[display(36), { color: brand.onPitch }]}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.email}>{user.email}</Text>
              </View>
            </View>
            <View style={{ marginTop: 14 }}>
              <BondBadge label="Bond Sports account" onPitch />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.k}>UNLMTD bookings run on Bond Sports</Text>
            <Text accessibilityRole="header" style={[display(58, 0.86, { top: 12, bottom: 6 }), { color: brand.onPitch }]}>
              Sign in
            </Text>
            <Text style={styles.cText}>Use your Bond account to book, see your games and check in at the front desk.</Text>
            <View style={styles.btns}>
              <Button style={{ flex: 1 }} onPress={() => router.push('/sign-in')}>
                Sign in
              </Button>
              <Button kind="line" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signup' } })}>
                Create account
              </Button>
            </View>
          </>
        )}
        {homeRow}
      </View>

      {user ? (
        <>
          <View style={styles.sec}>
            <SectionTitle>Bond ID</SectionTitle>
            <BondIdRows members={household} />
          </View>

          <View style={styles.sec}>
            <SectionTitle>Household</SectionTitle>
            <Rows>
              {household.map((m, i) => {
                const n = waiverCount[m.id] ?? 0;
                const age = new Date().getFullYear() - m.birthYear;
                return (
                  <Row
                    key={m.id}
                    first={i === 0}
                    title={`${m.firstName}${m.isAccountHolder ? ' (you)' : ''}`}
                    sub={`${m.isAccountHolder ? 'Account holder' : `Born ${m.birthYear}, age ${age}`}. ${n ? `${n} waiver${n > 1 ? 's' : ''} on file` : 'No waivers yet'}`}
                    right={
                      m.isAccountHolder ? null : (
                        <Pressable
                          onPress={async () => {
                            await bond.removeHouseholdMember(m.id).catch(() => {});
                            refresh();
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${m.firstName}`}
                          style={[styles.mini, { borderColor: c.rule }]}>
                          <Text style={[styles.miniT, { color: c.text }]}>Remove</Text>
                        </Pressable>
                      )
                    }
                  />
                );
              })}
              {addingChild ? (
                <AddChildForm
                  onAdd={async (first, year) => {
                    await bond.addHouseholdMember(first, year);
                    await refresh();
                    setAddingChild(false);
                    toast(`${first} added to your household`);
                  }}
                />
              ) : (
                <AddRow label="Add a child" onPress={() => setAddingChild(true)} />
              )}
            </Rows>
          </View>

          <View style={styles.sec}>
            <SectionTitle>Payment methods</SectionTitle>
            <Rows>
              <Row first title={Platform.OS === 'android' ? 'Google Pay' : 'Apple Pay'} sub="Offered at checkout on this device" />
              {cards.map((cd) => (
                <Row
                  key={cd.id}
                  title={`${cd.brand} ending ${cd.last4}`}
                  sub={`Saved in your Bond account. Expires ${cd.exp}`}
                  right={
                    <Pressable
                      onPress={async () => {
                        await bond.removeSavedCard(cd.id).catch(() => {});
                        await refresh();
                        toast('Card removed from your Bond account');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${cd.brand} ending ${cd.last4}`}
                      style={[styles.mini, { borderColor: c.rule }]}>
                      <Text style={[styles.miniT, { color: c.text }]}>Remove</Text>
                    </Pressable>
                  }
                />
              ))}
            </Rows>
          </View>
        </>
      ) : null}

      <View style={styles.sec}>
        <SectionTitle>Your club</SectionTitle>
        <ClubDetails club={club} />
      </View>

      <View style={styles.sec}>
        <SectionTitle>Notifications</SectionTitle>
        <Rows>
          {toggle('spots', 'Pickup spots', 'When a full game opens up', true)}
          {WEB_MODE ? null : toggle('remind', 'Game reminders', 'Two hours before kickoff')}
          {toggle('news', 'Club news', 'Camps, events and new programs at your club')}
        </Rows>
      </View>

      <View style={styles.sec}>
        <SectionTitle>Appearance</SectionTitle>
        <View style={[styles.seg, { backgroundColor: c.surface2 }]} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
          {(['system', 'light', 'dark'] as ThemePref[]).map((t) => {
            const on = themePref === t;
            return (
              <Pressable
                key={t}
                onPress={() => setThemePref(t)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[styles.segBtn, on && { backgroundColor: c.surface, shadowColor: '#001410', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }]}>
                <Text style={[styles.segT, { color: on ? c.text : c.text2 }]}>{t[0].toUpperCase() + t.slice(1)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.sec}>
        <Rows>
          {user ? (
            <Row
              first
              title="Sign out"
              icon="chev"
              onPress={async () => {
                await signOut();
                toast('Signed out');
              }}
            />
          ) : null}
          <Row
            first={!user}
            title="Show first-launch setup again"
            sub={WEB_MODE ? 'Clears your home club on this device' : 'Signs out and clears your home club on this device'}
            icon="chev"
            onPress={async () => {
              await signOut();
              setClub(null);
            }}
          />
          {user ? (
            <Row
              danger
              title={deleteArmed ? 'Tap again to request deletion' : 'Delete account'}
              sub={deleteArmed ? 'Bond deletes your account and saved details' : 'Sends a deletion request for your Bond account'}
              onPress={async () => {
                if (!deleteArmed) return setDeleteArmed(true);
                setDeleteArmed(false);
                await bond.requestAccountDeletion().catch(() => {});
                setUser(null);
                toast('Deletion request sent to Bond Sports');
              }}
            />
          ) : null}
        </Rows>
      </View>

      <Text style={[styles.fine, { color: c.text2 }]}>
        Accounts, bookings, waivers and payments run on Bond Sports, UNLMTD’s booking system. The same account works on unlmtdsoccer.com.
      </Text>
    </TabScreen>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  const { c } = useTheme();
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: on ? 1 : 0, friction: 6, tension: 120, useNativeDriver: false }).start();
  }, [on, x]);
  return (
    <Pressable onPress={() => onChange(!on)} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: on }} hitSlop={8}>
      <Animated.View style={[styles.toggle, { backgroundColor: x.interpolate({ inputRange: [0, 1], outputRange: [c.surface2, brand.green] }) }]}>
        <Animated.View style={[styles.knob, { backgroundColor: c.knob, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', marginTop: 16, marginHorizontal: 20, padding: 20, borderRadius: 22, backgroundColor: brand.pitch, borderWidth: 1, borderColor: brand.onPitch3 },
  k: { color: brand.onPitch2, fontFamily: font.semibold, fontSize: 13.5 },
  cText: { marginBottom: 18, color: brand.onPitch2, fontFamily: font.regular, fontSize: 16, lineHeight: 23 },
  btns: { flexDirection: 'row', gap: 10 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: brand.yellow, alignItems: 'center', justifyContent: 'center' },
  email: { marginTop: 4, color: brand.onPitch2, fontFamily: font.regular, fontSize: 14 },
  homeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: brand.onPitch3 },
  k2: { color: brand.onPitch2, fontFamily: font.regular, fontSize: 13 },
  sec: { paddingTop: 26, paddingHorizontal: 20 },
  seg: { flexDirection: 'row', padding: 4, borderRadius: 999 },
  segBtn: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  segT: { fontFamily: font.semibold, fontSize: 14 },
  mini: { height: 34, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  miniT: { fontFamily: font.semibold, fontSize: 13 },
  fine: { marginTop: 22, paddingHorizontal: 20, fontFamily: font.regular, fontSize: 12.5, lineHeight: 18 },
  toggle: { width: 50, height: 30, borderRadius: 999, padding: 3 },
  knob: { width: 24, height: 24, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
});
