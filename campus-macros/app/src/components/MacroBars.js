import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

const ROWS = [['protein', 'Protein', colors.protein], ['carbs', 'Carbs', colors.carbs], ['fat', 'Fat', colors.fat]];

// Eaten vs target for each macro. Overshoot shows as a darker cap past the end.
export default function MacroBars({ totals = {}, targets = {} }) {
  return (
    <View style={{ gap: 12 }}>
      {ROWS.map(([k, label, color]) => {
        const eaten = totals[k] || 0, target = targets[k] || 0;
        const pct = target ? Math.min(eaten / target, 1) : 0;
        const over = target && eaten > target;
        return (
          <View key={k}>
            <View style={s.row}>
              <Text style={s.label}>{label}</Text>
              <Text style={[s.value, over && { color: colors.danger }]}>{Math.round(eaten)} / {target} g</Text>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  value: { fontSize: 14, color: colors.muted, fontVariant: ['tabular-nums'] },
  track: { height: 8, backgroundColor: colors.line, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
