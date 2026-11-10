// Pickup: program → session list with spots left. Single sessions only.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { bond, type Club, type PickupProgram, type PickupSession } from '@/bond';
import { fmtTime, money0, monthShort, parseIso, weekdayLong } from '@/lib/format';
import { useBooking } from '@/state/booking';
import { brand, font, useTheme } from '@/theme';

import { Bracket, DateBlock, EmptyDay, InfoCard, infoText, Step } from './parts';

export function PickupSteps({ club }: { club: Club }) {
  const { c } = useTheme();
  const b = useBooking();
  const [programs, setPrograms] = useState<PickupProgram[]>([]);
  const [sessions, setSessions] = useState<PickupSession[] | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const program = programs.find((p) => p.id === b.programId) ?? programs[0];

  useEffect(() => {
    bond.getPickupPrograms(club).then(setPrograms);
  }, [club]);

  useEffect(() => {
    if (!program) return;
    let live = true;
    setSessions(null);
    bond.getPickupSessions(club, program).then((s) => live && setSessions(s));
    return () => {
      live = false;
    };
  }, [club, program]);

  if (!program) return <ActivityIndicator style={{ marginTop: 24 }} color={c.text2} />;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Program">
        {programs.map((p) => {
          const on = p.id === program.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => b.set({ programId: p.id, session: null })}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={[styles.chip, on ? { backgroundColor: c.text, borderColor: 'transparent' } : { backgroundColor: c.surface, borderColor: c.rule }]}>
              <Text style={[styles.chipT, { color: on ? c.bg : c.text }]}>{p.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <InfoCard title={program.name} ages={`${program.ages} years old`}>
        <Text style={infoText}>{program.blurb}</Text>
        <Pressable onPress={() => setRulesOpen(!rulesOpen)} accessibilityRole="button" accessibilityState={{ expanded: rulesOpen }} style={{ marginTop: 10 }}>
          <Text style={styles.summary}>{rulesOpen ? '▾' : '▸'} How pickup works</Text>
        </Pressable>
        {rulesOpen
          ? program.rules.map((r) => (
              <Text key={r} style={[infoText, { fontSize: 13.5, marginTop: 6 }]}>
                • {r}
              </Text>
            ))
          : null}
      </InfoCard>

      <Step>Pick your session</Step>
      {sessions == null ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={c.text2} />
      ) : !sessions.length ? (
        <EmptyDay>No sessions in the next two weeks.</EmptyDay>
      ) : (
        <View style={styles.sessions}>
          {sessions.map((s) => {
            const d = parseIso(s.date);
            const on = b.session?.id === s.id;
            const full = s.spotsLeft === 0;
            const low = !full && s.spotsLeft <= 3;
            return (
              <Bracket key={s.id} on={on}>
                <Pressable
                  onPress={() => b.set({ session: s })}
                  disabled={full}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, disabled: full }}
                  style={[styles.session, { backgroundColor: c.surface, borderColor: on ? c.text : c.rule, borderWidth: on ? 2 : 1, opacity: full ? 0.5 : 1 }]}>
                  <DateBlock day={d.getDate()} month={monthShort(d)} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sTitle, { color: c.text }]}>
                      {weekdayLong(d)}, {fmtTime(s.start)}–{fmtTime(s.start + s.length)}
                    </Text>
                    <Text style={[styles.sDesc, { color: c.text2 }]}>
                      {s.name}, {money0(s.price, club.currency)}
                    </Text>
                    <View style={styles.meter}>
                      <View style={[styles.bar, { backgroundColor: c.surface2 }]}>
                        <View style={[styles.fill, { width: `${Math.round(((s.capacity - s.spotsLeft) / s.capacity) * 100)}%` }]} />
                      </View>
                      <Text style={[styles.left, { color: low ? c.text : c.text2, fontFamily: low ? font.bold : font.semibold }]}>{full ? 'Full' : `${s.spotsLeft} spots left`}</Text>
                    </View>
                  </View>
                </Pressable>
              </Bracket>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingTop: 4, paddingHorizontal: 20, paddingBottom: 4 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  chipT: { fontFamily: font.semibold, fontSize: 13.5 },
  summary: { color: brand.onPitch, fontFamily: font.bold, fontSize: 13.5 },
  sessions: { gap: 10, paddingTop: 6, paddingHorizontal: 20 },
  session: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: 14, paddingRight: 16, borderRadius: 18 },
  sTitle: { fontFamily: font.bold, fontSize: 15.5, lineHeight: 19 },
  sDesc: { marginTop: 3, fontFamily: font.regular, fontSize: 13 },
  meter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  bar: { flex: 1, height: 5, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 5, backgroundColor: brand.red },
  left: { fontSize: 12.5 },
});
