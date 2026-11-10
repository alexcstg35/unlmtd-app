// Club search + "Find my nearest club" + list grouped by region.
// Used on the first-launch screen (green) and in the Switch club sheet.
import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Club } from '@/bond';
import { fmtDist, miles } from '@/lib/format';
import { useToast } from '@/state/toast';
import { brand, display, font, useTheme } from '@/theme';

import { Icon } from './Icon';

export function ClubList({ clubs, currentId, onPick, onPitch }: { clubs: Club[]; currentId?: string | null; onPick: (id: string) => void; onPitch?: boolean }) {
  const { c } = useTheme();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const col = onPitch
    ? { text: brand.onPitch, text2: brand.onPitch2, rule: brand.onPitch3, field: brand.pitch2, tag: brand.onPitch4 }
    : { text: c.text, text2: c.text2, rule: c.rule, field: c.surface, tag: c.rule };

  async function locate() {
    const fail = () => toast('Location is off here. Pick your club from the list.');
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return fail();
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGeo({ lat: p.coords.latitude, lng: p.coords.longitude });
    } catch {
      fail();
    } finally {
      setLocating(false);
    }
  }

  const query = q.trim().toLowerCase();
  const list = useMemo(() => clubs.filter((x) => !query || `${x.name} ${x.city} ${x.region}`.toLowerCase().includes(query)), [clubs, query]);
  const regions = useMemo(() => [...new Set(clubs.map((x) => x.region))], [clubs]);

  const row = (club: Club, dist?: number) => {
    const current = club.id === currentId;
    return (
      <Pressable
        key={club.id}
        onPress={() => onPick(club.id)}
        accessibilityRole="button"
        accessibilityLabel={`${club.name}, ${club.city}${club.openingSoon ? ', opening soon' : ''}`}
        accessibilityState={{ selected: current }}
        style={[styles.row, { borderBottomColor: col.rule }]}>
        {({ pressed }) => (
          <>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[display(29, 0.95), { color: pressed && onPitch ? brand.yellow : col.text }]}>{club.name}</Text>
              <Text style={[styles.city, { color: col.text2 }]}>{club.city}</Text>
            </View>
            {dist != null ? <Text style={[styles.dist, { color: col.text2 }]}>{fmtDist(dist)}</Text> : null}
            {club.openingSoon ? (
              <View style={[styles.tag, { borderColor: col.tag }]}>
                <Text style={[styles.tagT, { color: col.text2 }]}>Opening soon</Text>
              </View>
            ) : null}
            {current ? <Icon name="check" size={22} color={col.text} /> : null}
          </>
        )}
      </Pressable>
    );
  };

  const group = (t: string) => (
    <Text key={`g-${t}`} style={[styles.group, { color: col.text2 }]}>
      {t}
    </Text>
  );

  let body: React.ReactNode;
  if (!list.length) {
    body = <Text style={[styles.noMatch, { color: col.text2 }]}>No club matches “{query}”. Try a city, like Brooklyn or Montréal.</Text>;
  } else if (geo) {
    body = [group('Closest to you'), ...list.map((x) => ({ x, d: miles(geo, x) })).sort((a, b) => a.d - b.d).map(({ x, d }) => row(x, d))];
  } else {
    body = regions.flatMap((r) => {
      const cs = list.filter((x) => x.region === r);
      return cs.length ? [group(r), ...cs.map((x) => row(x))] : [];
    });
  }

  return (
    <View>
      <View style={[styles.search, { backgroundColor: col.field, borderColor: col.rule }]}>
        <Icon name="search" size={18} color={col.text} opacity={0.6} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search clubs or cities"
          placeholderTextColor={col.text2}
          accessibilityLabel="Search clubs or cities"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={[styles.searchInput, { color: col.text }]}
        />
      </View>
      <Pressable onPress={locate} disabled={locating} accessibilityRole="button" accessibilityState={{ busy: locating }} style={[styles.near, { opacity: locating ? 0.6 : 1 }]}>
        <Icon name="target" size={18} color={col.text} />
        <Text style={[styles.nearT, { color: col.text }]}>Find my nearest club</Text>
      </Pressable>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, height: '100%', fontFamily: font.regular, fontSize: 16 },
  near: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 2, paddingVertical: 8, alignSelf: 'flex-start' },
  nearT: { fontFamily: font.semibold, fontSize: 14 },
  group: { marginTop: 18, fontFamily: font.bold, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 2, borderBottomWidth: 1 },
  city: { fontFamily: font.regular, fontSize: 13 },
  dist: { fontFamily: font.semibold, fontSize: 13 },
  tag: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1 },
  tagT: { fontFamily: font.bold, fontSize: 11.5 },
  noMatch: { marginTop: 18, fontFamily: font.regular, fontSize: 15 },
});
