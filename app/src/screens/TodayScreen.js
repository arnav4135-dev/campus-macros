import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import MacroBars from '../components/MacroBars';
import Button from '../components/Button';
import { colors, type, radius } from '../theme';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function TodayScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api('/log')); setError(null); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (entry) => Alert.alert('Remove entry?', entry.name, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => setData(await api(`/log/${entry.id}`, { method: 'DELETE' })) },
  ]);

  const r = data?.remaining, t = data?.targets;
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.wrap} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={type.small}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      {t ? (
        <>
          <View style={s.hero}>
            <Text style={s.heroNum}>{Math.max(r.protein, 0)}<Text style={s.heroUnit}> g</Text></Text>
            <Text style={s.heroLabel}>protein left today</Text>
            <Text style={s.heroSub}>{r.calories} kcal remaining of {t.calories}</Text>
          </View>
          <View style={s.card}><MacroBars totals={data.totals} targets={t} /></View>
          <Button title="What should I get right now?" onPress={() => navigation.navigate('Eat', { screen: 'Recommend' })} />
        </>
      ) : (
        <View style={s.card}>
          <Text style={type.h2}>No targets yet</Text>
          <Text style={type.small}>Set them in the You tab to unlock recommendations.</Text>
        </View>
      )}

      {MEAL_ORDER.filter((m) => data?.byMeal?.[m]).map((m) => {
        const meal = data.byMeal[m];
        return (
          <View key={m} style={s.card}>
            <View style={s.mealHead}>
              <Text style={type.h2}>{m[0].toUpperCase() + m.slice(1)}</Text>
              <Text style={type.small}>{meal.calories} kcal · {meal.protein}p {meal.carbs}c {meal.fat}f</Text>
            </View>
            {meal.entries.map((e) => (
              <Pressable key={e.id} onLongPress={() => remove(e)} style={s.entry}>
                <Text style={s.entryName} numberOfLines={1}>{e.name}{e.servings !== 1 ? ` ×${e.servings}` : ''}{e.estimated ? '  (est.)' : ''}</Text>
                <Text style={s.entryMacros}>{Math.round(e.calories * e.servings)} · {Math.round(e.protein * e.servings)}p</Text>
              </Pressable>
            ))}
          </View>
        );
      })}
      {data && !Object.keys(data.byMeal || {}).length ? <Text style={[type.small, { textAlign: 'center' }]}>Nothing logged yet. Search, browse the menu, or snap a photo.</Text> : null}
      <Text style={[type.small, { textAlign: 'center' }]}>Long-press an entry to remove it.</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  wrap: { padding: 20, gap: 16, paddingBottom: 40 },
  hero: { paddingVertical: 8 },
  heroNum: { ...type.display, fontSize: 64, color: colors.maroon, fontVariant: ['tabular-nums'] },
  heroUnit: { fontSize: 28, fontWeight: '500', color: colors.maroon },
  heroLabel: { ...type.h2, color: colors.ink },
  heroSub: { ...type.small, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 8 },
  mealHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  entry: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line, gap: 12 },
  entryName: { ...type.body, flex: 1 },
  entryMacros: { ...type.small, fontVariant: ['tabular-nums'] },
});
