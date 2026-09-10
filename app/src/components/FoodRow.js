import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

const n = (v) => (v == null ? '–' : Math.round(v));

export default function FoodRow({ item, onPress, right }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.maroonSoft }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.name} numberOfLines={2}>{item.name}</Text>
          {item.estimated ? <Text style={s.est}>est.</Text> : null}
        </View>
        {item.detail || item.portion ? <Text style={s.detail} numberOfLines={1}>{[item.detail, item.portion].filter(Boolean).join(' · ')}</Text> : null}
        <Text style={s.macros}>
          {n(item.calories)} kcal · <Text style={{ color: colors.protein }}>{n(item.protein)}p</Text> · <Text style={{ color: colors.carbs }}>{n(item.carbs)}c</Text> · <Text style={{ color: colors.fat }}>{n(item.fat)}f</Text>
        </Text>
      </View>
      {right}
    </Pressable>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line, gap: 12 },
  name: { fontSize: 16, fontWeight: '500', color: colors.ink, flexShrink: 1 },
  detail: { fontSize: 13, color: colors.muted, marginTop: 2 },
  macros: { fontSize: 13, color: colors.muted, marginTop: 4, fontVariant: ['tabular-nums'] },
  est: { fontSize: 11, fontWeight: '600', color: colors.estimate, backgroundColor: colors.estimateBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
});
