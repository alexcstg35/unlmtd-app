// Camps: pick a camp → which days (or all). Add-ons and campers come at checkout.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { bond, type Camp, type Club } from '@/bond';
import { fmtMD, money0, monthShort, parseIso, plural, weekdayShort } from '@/lib/format';
import { useBooking } from '@/state/booking';
import { brand, font, useTheme } from '@/theme';

import { Bracket, DateBlock, EmptyDay, InfoCard, infoText, Step } from './parts';

const dateLabel = (k: Camp) => (k.start === k.end ? fmtMD(parseIso(k.start)) : `${fmtMD(parseIso(k.start))}–${parseIso(k.end).getDate()}`);
const dayRange = (k: Camp) => {
  const a = weekdayShort(parseIso(k.start));
  return k.days.length === 1 ? `${a} ${k.hours}` : `${a}–${weekdayShort(parseIso(k.end))} ${k.hours}`;
};

export function CampSteps({ club }: { club: Club }) {
  const { c } = useTheme();
  const b = useBooking();
  const [camps, setCamps] = useState<Camp[] | null>(null);
  const cur = club.currency;

  useEffect(() => {
    let live = true;
    bond.getCamps(club).then((k) => live && setCamps(k));
    return () => {
      live = false;
    };
  }, [club]);

  const first = camps?.[0];
  const k = b.camp;
  const toggleDay = (d: string) => b.set({ campDays: b.campDays.includes(d) ? b.campDays.filter((x) => x !== d) : [...b.campDays, d] });

  return (
    <View>
      <InfoCard title="Camps" ages={first ? `${first.ages[0]} to ${first.ages[1]} years old` : '4 to 15 years old'}>
        <Text style={infoText}>
          School is off, soccer is on. {first?.hours ?? '9:00am–3:00pm'}, {money0(first?.pricePerDay ?? 110, cur)} per day. Early drop-off, lunch and late pickup can be added at checkout.
        </Text>
      </InfoCard>

      <Step>Pick a camp</Step>
      {camps == null ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={c.text2} />
      ) : !camps.length ? (
        <EmptyDay>No camps coming up at this club.</EmptyDay>
      ) : (
        <View style={styles.list}>
          {camps.map((x) => {
            const s0 = parseIso(x.start);
            const on = k?.id === x.id;
            return (
              <Bracket key={x.id} on={on}>
                <Pressable
                  onPress={() => b.set({ camp: x, campDays: [] })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={[styles.card, { backgroundColor: c.surface, borderColor: on ? c.text : c.rule, borderWidth: on ? 2 : 1 }]}>
                  <DateBlock day={s0.getDate()} month={monthShort(s0)} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: c.text }]}>
                      {dateLabel(x)}, {x.title}
                    </Text>
                    <Text style={[styles.desc, { color: c.text2 }]}>
                      {dayRange(x)}. {plural(x.days.length, 'day')}, {money0(x.pricePerDay, cur)} per day
                    </Text>
                  </View>
                </Pressable>
              </Bracket>
            );
          })}
        </View>
      )}

      {k ? (
        <>
          <Step>Which days?</Step>
          <View style={styles.daychips} accessibilityLabel="Camp days">
            {k.days.map((d) => {
              const on = b.campDays.includes(d);
              const dt = parseIso(d);
              return (
                <Pressable
                  key={d}
                  onPress={() => toggleDay(d)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={[styles.daychip, on ? { backgroundColor: brand.yellow, borderColor: 'transparent' } : { backgroundColor: c.surface, borderColor: c.rule }]}>
                  <Text style={[styles.dcB, { color: on ? brand.ink : c.text }]}>{weekdayShort(dt)}</Text>
                  <Text style={[styles.dcS, { color: on ? brand.ink : c.text2 }]}>{fmtMD(dt)}</Text>
                </Pressable>
              );
            })}
          </View>
          {k.days.length > 1 ? (
            <Pressable onPress={() => b.set({ campDays: b.campDays.length === k.days.length ? [] : [...k.days] })} accessibilityRole="button" style={styles.selall}>
              <Text style={[styles.link, { color: c.text }]}>{b.campDays.length === k.days.length ? 'Clear days' : `Select all ${k.days.length} days`}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, paddingTop: 6, paddingHorizontal: 20 },
  card: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14, paddingRight: 16, borderRadius: 18 },
  title: { fontFamily: font.bold, fontSize: 15.5, lineHeight: 19 },
  desc: { marginTop: 3, fontFamily: font.regular, fontSize: 13 },
  daychips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  daychip: { minWidth: 74, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  dcB: { fontFamily: font.bold, fontSize: 14 },
  dcS: { fontFamily: font.semibold, fontSize: 11.5 },
  selall: { marginTop: 10, marginHorizontal: 20, alignSelf: 'flex-start', paddingVertical: 4 },
  link: { fontFamily: font.semibold, fontSize: 14, textDecorationLine: 'underline' },
});
