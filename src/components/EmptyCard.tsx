import { StyleSheet, Text, View } from 'react-native';

import { font, title, useTheme } from '@/theme';

import { Icon } from './Icon';
import { Button } from './ui';

/** Empty-state card with the ticket icon, as on the Bookings tab. */
export function EmptyCard({ heading, body, actions }: { heading: string; body: string; actions: { label: string; kind: 'solid' | 'ghost'; onPress: () => void }[] }) {
  const { c } = useTheme();
  return (
    <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.rule }]}>
      <Icon name="ticket" size={58} color={c.text} />
      <Text accessibilityRole="header" style={[title(29), { color: c.text, marginTop: 16, marginBottom: 8 }]}>
        {heading}
      </Text>
      <Text style={[styles.p, { color: c.text2 }]}>{body}</Text>
      {actions.map((a, i) => (
        <Button key={a.label} kind={a.kind} onPress={a.onPress} style={i > 0 ? { marginTop: 10 } : undefined}>
          {a.label}
        </Button>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { marginTop: 18, marginHorizontal: 20, paddingTop: 26, paddingHorizontal: 22, paddingBottom: 22, borderRadius: 22, borderWidth: 1 },
  p: { marginBottom: 20, fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
});
