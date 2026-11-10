// Inline "Add a child" form: first name and birth year (3 to 17 years old).
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { capitalize } from '@/lib/format';
import { font, useTheme } from '@/theme';

import { Err, Field, Stepper } from './parts';

const THIS_YEAR = new Date().getFullYear();

/** Inline "Add a child" form: first name and birth year. */
export function AddChildForm({ onAdd, first }: { onAdd: (first: string, year: number) => Promise<void>; first?: boolean }) {
  const { c } = useTheme();
  const [name, setName] = useState('');
  const [year, setYear] = useState(THIS_YEAR - 8);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <View style={[{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 2 }, !first && { borderTopWidth: 1, borderTopColor: c.rule }]}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
        <Field label="Child’s first name" value={name} onChangeText={setName} autoComplete="off" invalid={!!err} />
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.label, { color: c.text2 }]}>Birth year</Text>
          <View style={{ height: 50, justifyContent: 'center' }}>
            <Stepper label="birth year" value={year} min={THIS_YEAR - 17} max={THIS_YEAR - 3} onChange={setYear} />
          </View>
        </View>
      </View>
      <Err>{err}</Err>
      <Button
        kind="solid"
        busy={busy}
        style={{ marginTop: 14, height: 46 }}
        onPress={async () => {
          const f = capitalize(name.trim());
          if (!f) return setErr('Add your child’s first name.');
          setBusy(true);
          await onAdd(f, year).catch(() => setErr('Couldn’t add them. Try again.'));
          setBusy(false);
        }}>
        Add to household
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6, fontFamily: font.semibold, fontSize: 13 },
});
