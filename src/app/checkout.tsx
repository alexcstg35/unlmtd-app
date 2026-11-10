// Checkout, in the prototype's order.
// Step 1 (in the app): extras or add-ons, who's playing, the form and waivers.
// Step 2: payment on Bond's hosted checkout, opened inside the app. Sample mode simulates it.
// Step 3: confirmation.
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bond, BOND_MODE, type Booking, type CampAddon, type CartItem, type CartLine, type Member, type RentalExtra } from '@/bond';
import { BookingDone } from '@/components/checkout/BookingDone';
import { AddChildForm } from '@/components/checkout/AddChildForm';
import { AddRow, Box, Callout, CoH, Err, Field, OptRow, Stepper, WaiverBlock } from '@/components/checkout/parts';
import { Icon } from '@/components/Icon';
import { Button, BondBadge } from '@/components/ui';
import { fmtTime, money, money0, plural } from '@/lib/format';
import { useApp } from '@/state/app';
import { useData } from '@/state/data';
import { APPROVAL_FROM, useBooking, type Selection } from '@/state/booking';
import { useToast } from '@/state/toast';
import { brand, display, font, useTheme } from '@/theme';
import { activityColor } from '@/theme/colors';
import { closeModal } from '@/components/Sheet';

const THIS_YEAR = new Date().getFullYear();
const ageOf = (m: Member) => THIS_YEAR - m.birthYear;
const nameOf = (m: Member) => (m.isAccountHolder ? `${m.firstName} (you)` : m.firstName);
const phoneOk = (p: string) => p.replace(/\D/g, '').length >= 7;

function eligible(m: Member, x: Selection) {
  if (x.kind === 'rental') return true;
  const age = ageOf(m);
  return age >= (x.minAge ?? 0) && age <= (x.maxAge ?? 200);
}

type Step = 'details' | 'pay' | 'done';
type Form = { phone: string; resName: string; sport: string; promo: string; ename: string; ephone: string };

export default function Checkout() {
  const { club, user } = useApp();
  const booking = useBooking();
  const data = useData();
  const { c } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  // Freeze what was picked: the Book tab resets once the booking is done.
  const [x] = useState(booking.selection);
  const [step, setStep] = useState<Step>('details');
  const [household, setHousehold] = useState<Member[]>([]);
  const [onFile, setOnFile] = useState<Record<string, boolean>>({});
  const [waiverText, setWaiverText] = useState('');
  const [extrasList, setExtrasList] = useState<RentalExtra[]>([]);
  const [addonsList, setAddonsList] = useState<CampAddon[]>([]);
  const [forId, setForId] = useState('self');
  const [people, setPeople] = useState<string[] | null>(null);
  const [addMember, setAddMember] = useState(false);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<Form>({ phone: '', resName: '', sport: '', promo: '', ename: '', ephone: '' });
  const [err, setErr] = useState<{ people?: string; form?: string; waiver?: string; pay?: string }>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);

  const scroll = useRef<ScrollViewInstance>(null);
  const anchors = useRef<Record<string, number>>({});
  const anchor = (k: string) => ({ onLayout: (e: { nativeEvent: { layout: { y: number } } }) => (anchors.current[k] = e.nativeEvent.layout.y) });

  // Load the household, waivers on file, extras and add-ons.
  useEffect(() => {
    if (!x || !club) return;
    (async () => {
      const hh = await bond.getHousehold();
      setHousehold(hh);
      const statuses = await Promise.all(hh.map((m) => bond.getWaiverStatus(m, x.waiverId)));
      setOnFile(Object.fromEntries(hh.map((m, i) => [m.id, statuses[i].signed])));
      setWaiverText(statuses[0]?.text ?? '');
      if (people == null) {
        const kids = hh.filter((m) => !m.isAccountHolder);
        if (x.kind === 'camp') {
          const k = kids.find((m) => eligible(m, x));
          setPeople(k ? [k.id] : []);
          setAddMember(!kids.length);
        } else setPeople(['self']);
      }
      if (x.kind === 'rental') setExtrasList(await bond.getRentalExtras(club));
      if (x.camp) setAddonsList(await bond.getCampAddons(club, x.camp.camp));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chosen = useMemo(() => (people ?? []).map((id) => household.find((m) => m.id === id)).filter((m): m is Member => !!m), [people, household]);

  const lines: CartLine[] = useMemo(() => {
    if (!x) return [];
    const out: CartLine[] = [];
    if (x.rental) {
      x.rental.slots.forEach((s) => out.push({ label: `${s.field}, ${fmtTime(s.start)}–${fmtTime(s.start + x.rental!.duration)}`, amount: s.price }));
      extrasList.forEach((e) => extras[e.id] && out.push({ label: `${e.name} × ${extras[e.id]}`, amount: e.price * extras[e.id] }));
    } else if (x.pickup) {
      const n = Math.max(1, chosen.length);
      out.push({ label: `1 pick-up session${n > 1 ? ` × ${n}` : ''}`, amount: x.price * n });
    } else if (x.camp) {
      const n = Math.max(1, chosen.length);
      const d = x.camp.days.length;
      out.push({ label: `${plural(d, 'camp day')}${n > 1 ? ` × ${n} campers` : ''}`, amount: x.price * n });
      addonsList.forEach((a) => addons[a.id] && out.push({ label: `${a.name}, ${plural(d, 'day')}${n > 1 ? ` × ${n}` : ''}`, amount: a.pricePerDay * d * n }));
    }
    return out;
  }, [x, extras, extrasList, addons, addonsList, chosen.length]);
  const total = lines.reduce((t, l) => t + l.amount, 0);

  if (!x || !club || !user) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + 40, paddingHorizontal: 20 }]}>
        <Text style={[styles.body, { color: c.text }]}>Nothing to check out. Pick a field, session or camp first.</Text>
        <Button kind="solid" style={{ marginTop: 16 }} onPress={() => closeModal()}>
          Back to booking
        </Button>
      </View>
    );
  }
  const cur = club.currency;

  const signers = x.kind === 'rental' ? household.filter((m) => m.isAccountHolder) : chosen;
  const needsSign = (m: Member) => !onFile[m.id];

  function showErr(e: typeof err, at: string) {
    setErr(e);
    const y = anchors.current[at];
    if (y != null) scroll.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  }

  function validate() {
    if (x!.kind !== 'rental') {
      if (!chosen.length) return showErr({ people: x!.kind === 'camp' ? 'Choose at least one camper.' : 'Choose who’s playing.' }, 'people'), false;
      if (chosen.length > x!.max) return showErr({ people: `Only ${x!.max} spots left.` }, 'people'), false;
    }
    if (x!.kind === 'rental' && (!phoneOk(form.phone) || !form.resName.trim())) return showErr({ form: 'Add a phone number and a name for the reservation.' }, 'form'), false;
    if (x!.kind === 'pickup' && !phoneOk(form.phone)) return showErr({ form: 'Add a phone number.' }, 'form'), false;
    if (x!.kind === 'camp' && (!form.ename.trim() || !phoneOk(form.ephone))) return showErr({ form: 'Add an emergency contact name and phone number.' }, 'form'), false;
    if (signers.some((m) => needsSign(m) && !agreed[m.id])) return showErr({ waiver: 'Read and accept each waiver to continue.' }, 'waiver'), false;
    setErr({});
    return true;
  }

  async function pay() {
    if (busy) return;
    setErr({});
    setBusy(true);
    try {
      const base = {
        clubId: club!.id,
        answers: Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim())),
        waiversAccepted: signers.filter(needsSign).map((m) => ({ memberId: m.id, waiver: x!.waiverId })),
        lines,
      };
      const item: CartItem = x!.rental
        ? { ...base, kind: 'rental', serviceId: x!.rental.service.id, date: x!.rental.date, duration: x!.rental.duration, slots: x!.rental.slots.map(({ start, field }) => ({ start, field })), extras, forMemberId: forId }
        : x!.pickup
          ? { ...base, kind: 'pickup', sessionId: x!.pickup.session.id, memberIds: people ?? [] }
          : { ...base, kind: 'camp', campId: x!.camp!.camp.id, days: x!.camp!.days, addons: Object.keys(addons).filter((k) => addons[k]), memberIds: people ?? [] };

      const forName = forId !== 'self' ? household.find((m) => m.id === forId)?.firstName : '';
      const who = x!.kind === 'rental' ? form.resName.trim() || forName || undefined : chosen.map((m) => m.firstName).join(', ');
      const picked = addonsList.filter((a) => addons[a.id]).map((a) => a.name.toLowerCase());
      const cart = await bond.buildCart([item], {
        title: x!.title,
        when: x!.when,
        short: x!.short,
        detail: x!.detail + (picked.length ? `. Add-ons: ${picked.join(', ')}` : ''),
        date: x!.date,
        start: x!.start,
        people: who,
      });

      if (BOND_MODE === 'live') {
        const returnUrl = Linking.createURL('checkout-done');
        const url = await bond.getCheckoutUrl(cart, returnUrl);
        const r = await WebBrowser.openAuthSessionAsync(url, returnUrl);
        if (r.type !== 'success') {
          setBusy(false);
          return toast('Payment not finished. Nothing was charged.');
        }
      }
      const b = await bond.getCartBooking(cart);
      if (!b) throw new Error('Bond didn’t confirm this booking. Check Bookings before trying again.');
      setDone(b);
      setStep('done');
      booking.reset();
      data.refresh();
    } catch (e) {
      setErr({ pay: e instanceof Error ? e.message : 'Payment didn’t go through. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  async function addChild(first: string, year: number) {
    const m = await bond.addHouseholdMember(first, year);
    setHousehold((h) => [...h, m]);
    setOnFile((o) => ({ ...o, [m.id]: false }));
    if (eligible(m, x!)) setPeople((p) => [...(p ?? []), m.id]);
    setAddMember(false);
    data.refresh();
    toast(`${first} added to your household`);
  }

  const title = step === 'done' ? (done?.status === 'pending' ? 'Requested' : 'Booked') : step === 'pay' ? 'Payment' : 'Checkout';

  const summary = (
    <View style={styles.sum}>
      <View style={[styles.sumDot, { backgroundColor: activityColor(x.color) }]} />
      <Text style={styles.sumK}>
        {x.actName} at {club.name}
      </Text>
      <Text style={[display(38), { color: brand.onPitch, marginTop: 10, marginBottom: 6 }]}>{x.title}</Text>
      <Text style={styles.sumP}>{x.when}</Text>
      <Text style={[styles.sumP, { color: brand.onPitch2, marginTop: 2 }]}>{x.detail}</Text>
    </View>
  );

  const pool = x.kind === 'camp' ? household.filter((m) => !m.isAccountHolder) : household;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={[styles.head, { borderBottomColor: c.rule }]}>
        {step === 'pay' && !busy ? (
          <Pressable onPress={() => setStep('details')} accessibilityRole="button" accessibilityLabel="Back to details" style={[styles.iconBtn, { backgroundColor: c.surface2 }]}>
            <Icon name="back" size={18} color={c.text} />
          </Pressable>
        ) : null}
        <Text accessibilityRole="header" style={[display(34), { color: c.text, flex: 1 }]}>
          {title}
        </Text>
        <Pressable onPress={() => closeModal()} disabled={busy} accessibilityRole="button" accessibilityLabel="Close checkout" style={[styles.iconBtn, { backgroundColor: c.surface2 }]}>
          <Icon name="close" size={18} color={c.text} />
        </Pressable>
      </View>

      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 }}>
        {step === 'done' && done ? (
          <BookingDone booking={done} email={user.email} club={club} />
        ) : step === 'pay' ? (
          <>
            {summary}
            <CoH>Pay</CoH>
            <View style={[styles.bond, { backgroundColor: c.surface, borderColor: c.rule }]}>
              <View style={[styles.bondTop, { borderBottomColor: c.rule }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="lock" size={15} color={c.text} />
                  <Text style={[styles.bondTopT, { color: c.text }]}>Secure checkout</Text>
                </View>
                <BondBadge />
              </View>
              <View style={{ padding: 16, paddingTop: 14 }}>
                <View style={[styles.lines, { backgroundColor: c.bg, borderColor: c.rule }]}>
                  {[...lines, { label: 'Tax', amount: 0 }].map((l, i) => (
                    <View key={l.label + i} style={[styles.line, i > 0 && { borderTopWidth: 1, borderTopColor: c.rule }]}>
                      <Text style={[styles.lineT, { color: c.text }]}>{l.label}</Text>
                      <Text style={[styles.lineT, { color: c.text }]}>{money(l.amount, cur)}</Text>
                    </View>
                  ))}
                  <View style={[styles.line, { borderTopWidth: 1, borderTopColor: c.rule }]}>
                    <Text style={[styles.lineT, { color: c.text, fontFamily: font.extrabold }]}>Total</Text>
                    <Text style={[styles.lineT, { color: c.text, fontFamily: font.extrabold }]}>{money(total, cur)}</Text>
                  </View>
                </View>
                <Text style={[styles.payNote, { color: c.text2 }]}>
                  You pay on Bond Sports’ secure checkout, which opens inside the app. Apple Pay, Google Pay and cards saved in your Bond account all work there. UNLMTD never sees your card number.
                </Text>
                {BOND_MODE === 'mock' ? <Text style={[styles.payNote, { color: c.text2 }]}>Sample mode: payment is simulated and nothing is charged.</Text> : null}
                <Err>{err.pay}</Err>
              </View>
            </View>
          </>
        ) : (
          <>
            {summary}
            {x.kind === 'rental' ? (
              <>
                <CoH>Booking for</CoH>
                <Box>
                  {household.map((m, i) => (
                    <OptRow key={m.id} kind="radio" first={i === 0} on={forId === m.id} title={nameOf(m)} sub={m.isAccountHolder ? user.email : `Age ${ageOf(m)}`} onPress={() => setForId(m.id)} />
                  ))}
                </Box>
                <CoH>Extras</CoH>
                <Box>
                  {extrasList.map((e) => (
                    <View key={e.id} style={styles.addon}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.addonT, { color: c.text }]}>{e.name}</Text>
                        <Text style={[styles.addonS, { color: c.text2 }]}>+{money0(e.price, cur)} per booking</Text>
                      </View>
                      <Stepper label={e.name} value={extras[e.id] ?? 0} onChange={(n) => setExtras({ ...extras, [e.id]: n })} />
                    </View>
                  ))}
                </Box>
                <View {...anchor('form')}>
                  <CoH>Additional information</CoH>
                  <Box inset>
                    <Field label="Email address" value={user.email} editable={false} hint="Prefilled from your Bond profile" />
                    <Field label="Phone number" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" invalid={!!err.form && !phoneOk(form.phone)} />
                    <Field label="Name of the reservation" placeholder="Team or group name" value={form.resName} onChangeText={(v) => setForm({ ...form, resName: v })} invalid={!!err.form && !form.resName.trim()} />
                    <Field label="Playing a sport other than soccer? (optional)" value={form.sport} onChangeText={(v) => setForm({ ...form, sport: v })} />
                    <Field label="Promo code (optional)" value={form.promo} autoCapitalize="characters" onChangeText={(v) => setForm({ ...form, promo: v })} />
                  </Box>
                  <Err>{err.form}</Err>
                </View>
              </>
            ) : (
              <>
                <View {...anchor('people')}>
                  <CoH>{x.kind === 'camp' ? 'Choose who you’re registering' : 'Who’s playing'}</CoH>
                  <Text style={[styles.mini, { color: c.text2 }]}>You can register more than one person.</Text>
                  <Box>
                    {pool.map((m, i) => {
                      const ok = eligible(m, x);
                      const on = (people ?? []).includes(m.id);
                      return (
                        <OptRow
                          key={m.id}
                          kind="check"
                          first={i === 0}
                          on={on}
                          disabled={!ok}
                          title={nameOf(m)}
                          sub={ok ? (m.isAccountHolder ? 'Account holder' : `Age ${ageOf(m)}`) : `Age ${ageOf(m)}, ${ageOf(m) > (x.maxAge ?? 200) ? 'too old' : 'too young'} for this ${x.kind === 'camp' ? 'camp' : 'session'}`}
                          onPress={() => (!ok ? toast('Not eligible for this program') : setPeople(on ? (people ?? []).filter((p) => p !== m.id) : [...(people ?? []), m.id]))}
                        />
                      );
                    })}
                    {x.kind === 'camp' ? addMember ? <AddChildForm first={!pool.length} onAdd={addChild} /> : <AddRow label="Add a child" onPress={() => setAddMember(true)} /> : null}
                  </Box>
                  <Err>{err.people}</Err>
                </View>

                {x.camp ? (
                  <>
                    <CoH>Add-ons</CoH>
                    <Box>
                      {addonsList.map((a, i) => {
                        const d = x.camp!.days.length;
                        return (
                          <OptRow
                            key={a.id}
                            kind="check"
                            first={i === 0}
                            on={!!addons[a.id]}
                            title={a.name}
                            sub={`${a.detail}. ${money0(a.pricePerDay, cur)} per day, ${money0(a.pricePerDay * d, cur)} for your ${plural(d, 'day')}`}
                            onPress={() => setAddons({ ...addons, [a.id]: !addons[a.id] })}
                          />
                        );
                      })}
                    </Box>
                    <View {...anchor('form')}>
                      <CoH>Camp application</CoH>
                      <Box inset>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <Field label="Emergency contact" value={form.ename} onChangeText={(v) => setForm({ ...form, ename: v })} invalid={!!err.form && !form.ename.trim()} />
                          <Field label="Their phone" value={form.ephone} keyboardType="phone-pad" onChangeText={(v) => setForm({ ...form, ephone: v })} invalid={!!err.form && !phoneOk(form.ephone)} />
                        </View>
                        <Text style={[styles.mini, { color: c.text2, marginTop: 10, marginBottom: 0 }]}>
                          Placeholder fields until we copy Bond’s real camp application form.
                        </Text>
                      </Box>
                      <Err>{err.form}</Err>
                    </View>
                  </>
                ) : (
                  <View {...anchor('form')}>
                    <CoH>Application</CoH>
                    <Box inset>
                      <Field label="Email address" value={user.email} editable={false} />
                      <Field label="Phone number" value={form.phone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" onChangeText={(v) => setForm({ ...form, phone: v })} invalid={!!err.form && !phoneOk(form.phone)} />
                    </Box>
                    <Err>{err.form}</Err>
                  </View>
                )}
              </>
            )}

            {signers.length ? (
              <View {...anchor('waiver')}>
                <CoH>Required documents</CoH>
                <Box>
                  {signers.map((m, i) => (
                    <WaiverBlock
                      key={m.id}
                      first={i === 0}
                      name={x.waiverName}
                      who={m.isAccountHolder ? undefined : m.firstName}
                      text={waiverText}
                      onFile={!!onFile[m.id]}
                      agreed={!!agreed[m.id]}
                      onAgree={(v) => setAgreed({ ...agreed, [m.id]: v })}
                    />
                  ))}
                </Box>
                <Err>{err.waiver}</Err>
              </View>
            ) : null}

            {x.needsApproval ? <Callout>{`Late-night booking. ${club.name} reviews requests from ${fmtTime(APPROVAL_FROM)} and confirms by email.`}</Callout> : null}
            {x.kind === 'rental' ? <Callout>After booking, you can send your team a link to split the cost.</Callout> : null}
          </>
        )}
      </ScrollView>

      {step !== 'done' ? (
        <View style={[styles.foot, { borderTopColor: c.rule, backgroundColor: c.bg, paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View>
            <Text style={[styles.totK, { color: c.text2 }]}>Total</Text>
            <Text style={[styles.totV, { color: c.text }]}>{money(total, cur)}</Text>
          </View>
          <Button style={{ flex: 1 }} busy={busy} onPress={() => (step === 'pay' ? pay() : validate() && (setStep('pay'), scroll.current?.scrollTo({ y: 0, animated: false })))}>
            {busy ? 'Paying' : step === 'pay' ? `Pay ${money(total, cur)}` : 'Continue to payment'}
          </Button>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 22 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14, paddingBottom: 12, paddingLeft: 20, paddingRight: 16, borderBottomWidth: 1 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  sum: { overflow: 'hidden', paddingVertical: 18, paddingRight: 18, paddingLeft: 20, borderRadius: 20, backgroundColor: brand.pitch, borderWidth: 1, borderColor: brand.onPitch3 },
  sumDot: { position: 'absolute', top: -34, right: -34, width: 76, height: 76, borderRadius: 38 },
  sumK: { paddingRight: 44, color: brand.onPitch2, fontFamily: font.semibold, fontSize: 13 },
  sumP: { color: brand.onPitch, fontFamily: font.regular, fontSize: 14.5, lineHeight: 20 },
  mini: { marginTop: -4, marginBottom: 10, marginHorizontal: 2, fontFamily: font.regular, fontSize: 12.5 },
  addon: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  addonT: { fontFamily: font.semibold, fontSize: 14.5 },
  addonS: { fontFamily: font.regular, fontSize: 13 },
  bond: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  bondTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  bondTopT: { fontFamily: font.bold, fontSize: 13.5 },
  lines: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9 },
  lineT: { flexShrink: 1, fontFamily: font.regular, fontSize: 14.5 },
  payNote: { marginTop: 14, fontFamily: font.regular, fontSize: 12.5, lineHeight: 18 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 12, paddingLeft: 20, paddingRight: 16, borderTopWidth: 1 },
  totK: { fontFamily: font.semibold, fontSize: 12.5 },
  totV: { fontFamily: font.display, fontSize: 26, lineHeight: 30 },
});
