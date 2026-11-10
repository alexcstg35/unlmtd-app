// Field rental: service → date → duration → field-by-time grid (pick one or more).
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { bond, type Club, type RentalService, type Slot } from '@/bond';
import { fmtDay, fmtDayLong, fmtTime, iso, money0, monthShort, tzLabel, weekdayShort } from '@/lib/format';
import { APPROVAL_FROM, DURATIONS, useBooking } from '@/state/booking';
import { anton, brand, font, title, useTheme } from '@/theme';

import { Bracket, EmptyDay, PeakTag, Seg, Step } from './parts';

export function RentalSteps({ club }: { club: Club }) {
  const { c } = useTheme();
  const b = useBooking();
  const [services, setServices] = useState<RentalService[]>([]);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const cur = club.currency;

  useEffect(() => {
    let live = true;
    bond.getRentalServices(club).then((list) => {
      if (!live) return;
      setServices(list);
      if (!b.service || !list.some((s) => s.id === b.service!.id)) b.set({ service: list[0] ?? null, slots: [] });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club.id]);

  const day = b.days[b.day];
  const dur = DURATIONS[b.dur];
  useEffect(() => {
    if (!b.service) return;
    let live = true;
    setSlots(null);
    bond.getRentalAvailability(club, b.service, iso(day), dur.h).then((s) => live && setSlots(s));
    return () => {
      live = false;
    };
  }, [club, b.service, day, dur.h]);

  const range = (s: RentalService) => (s.priceFrom === s.priceTo ? money0(s.priceFrom, cur) : `${money0(s.priceFrom, cur)}–${money0(s.priceTo, cur)}`);
  const open = (slots ?? []).filter((s) => s.openFields.length);

  const toggle = (s: Slot, field: string) => {
    const i = b.slots.findIndex((x) => x.start === s.start && x.field === field);
    b.set({ slots: i >= 0 ? b.slots.filter((_, k) => k !== i) : [...b.slots, { start: s.start, field, price: s.price, needsApproval: s.needsApproval }] });
  };

  return (
    <View>
      <Step>Select your service</Step>
      <View style={styles.svcGrid} accessibilityRole="radiogroup" accessibilityLabel="Service">
        {services.map((s) => {
          const on = b.service?.id === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => b.set({ service: s, slots: [] })}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={[styles.svc, { backgroundColor: c.surface, borderColor: on ? brand.yellow : c.rule, borderWidth: on ? 2 : 1 }]}>
              <Text style={[title(21), { color: c.text }]}>{s.name}</Text>
              <Text style={[styles.svcPrice, { color: c.text }]}>{range(s)} / 1 hr</Text>
              {s.tags.map((t) => (
                <View key={t} style={[styles.svcTag, { backgroundColor: c.surface2 }]}>
                  <Text style={[styles.svcTagT, { color: c.text2 }]}>% {t}</Text>
                </View>
              ))}
            </Pressable>
          );
        })}
      </View>

      <Step>Date</Step>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days} accessibilityRole="radiogroup" accessibilityLabel="Date">
        {b.days.map((d, i) => {
          const on = i === b.day;
          return (
            <Bracket key={i} on={on}>
              <Pressable
                onPress={() => b.set({ day: i, slots: [] })}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={fmtDayLong(d)}
                style={[styles.day, on ? { backgroundColor: brand.yellow, borderColor: 'transparent' } : { backgroundColor: c.surface, borderColor: c.rule }]}>
                <Text style={[styles.daySmall, { color: on ? brand.ink : c.text2 }]}>{i === 0 ? 'Today' : weekdayShort(d)}</Text>
                <Text style={[anton(25, 27), { color: on ? brand.ink : c.text }]}>{d.getDate()}</Text>
                <Text style={[styles.daySmall, { color: on ? brand.ink : c.text2 }]}>{monthShort(d)}</Text>
              </Pressable>
            </Bracket>
          );
        })}
      </ScrollView>

      <Step>Duration</Step>
      <View style={{ paddingHorizontal: 20 }}>
        <Seg label="Duration" values={DURATIONS.map((x) => x.label)} value={b.dur} onChange={(i) => b.set({ dur: i, slots: [] })} />
      </View>

      <Step>Select a space and time</Step>
      <Text style={[styles.legend, { color: c.text2 }]}>
        Times in {tzLabel(club)} time. You can pick more than one slot. <Text style={{ color: brand.red }}>●</Text> From {fmtTime(APPROVAL_FROM)}, the club approves each booking.
      </Text>

      {slots == null ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={c.text2} />
      ) : !open.length ? (
        <EmptyDay>{`No open fields on ${fmtDay(day)} for ${dur.label}. Try another day or a shorter booking.`}</EmptyDay>
      ) : (
        <View style={styles.tlist} accessibilityLabel="Space and time">
          {open.map((s) => (
            <View key={s.start} style={[styles.trow, { backgroundColor: c.surface, borderColor: c.rule }]}>
              <View style={styles.tt}>
                <Text style={[styles.ttB, { color: c.text }]}>{fmtTime(s.start)}</Text>
                <Text style={[styles.ttS, { color: c.text2 }]}>to {fmtTime(s.start + dur.h)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.ttS, { color: c.text2 }]}>{money0(s.price, cur)}</Text>
                  {s.peak ? <PeakTag /> : null}
                </View>
                {s.needsApproval ? <View style={styles.ap} /> : null}
              </View>
              <View style={styles.spaces}>
                {s.openFields.map((f) => {
                  const on = b.slots.some((x) => x.start === s.start && x.field === f);
                  return (
                    <Bracket key={f} on={on}>
                      <Pressable
                        onPress={() => toggle(s, f)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        accessibilityLabel={`${fmtTime(s.start)}, ${f}, ${money0(s.price, cur)}${s.needsApproval ? ', needs club approval' : ''}`}
                        style={[styles.space, on ? { backgroundColor: brand.yellow, borderColor: 'transparent' } : { backgroundColor: c.bg, borderColor: c.rule }]}>
                        <Text style={[styles.spaceT, { color: on ? brand.ink : c.text }]}>{f}</Text>
                      </Pressable>
                    </Bracket>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  svcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  svc: { width: '48.5%', flexGrow: 0, minHeight: 118, justifyContent: 'flex-end', alignItems: 'flex-start', gap: 6, padding: 14, borderRadius: 18 },
  svcPrice: { fontFamily: font.bold, fontSize: 13.5 },
  svcTag: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  svcTagT: { fontFamily: font.bold, fontSize: 11.5 },
  days: { gap: 8, paddingTop: 6, paddingBottom: 8, paddingHorizontal: 20 },
  day: { width: 58, height: 76, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 16, borderWidth: 1 },
  daySmall: { fontFamily: font.semibold, fontSize: 11.5 },
  legend: { marginHorizontal: 20, fontFamily: font.regular, fontSize: 12.5, lineHeight: 18 },
  tlist: { gap: 8, marginTop: 12, paddingHorizontal: 20 },
  trow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  tt: { width: 80 },
  ttB: { fontFamily: font.extrabold, fontSize: 15 },
  ttS: { fontFamily: font.semibold, fontSize: 12 },
  ap: { position: 'absolute', top: 3, right: 4, width: 7, height: 7, borderRadius: 4, backgroundColor: brand.red },
  spaces: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  space: { height: 38, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  spaceT: { fontFamily: font.semibold, fontSize: 13.5 },
});
