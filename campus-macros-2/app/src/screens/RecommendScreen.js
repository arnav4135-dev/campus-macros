import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { api, q } from '../api';
import LogSheet from '../components/LogSheet';
import Button from '../components/Button';
import { colors, type, radius } from '../theme';

export default function RecommendScreen({ route }) {
  const period = route.params?.period;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [proteinFirst, setProteinFirst] = useState(true);
  const [selected, setSelected] = useState(null);
  const [queue, setQueue] = useState([]);   // remaining items of a combo being logged one by one

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api(`/recommend?${q({ period, protein_w: proteinFirst ? 3 : 1 })}`)); setError(null); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [period, proteinFirst]);
  useEffect(() => { load(); }, [load]);

  const logCombo = (items) => { const [first, ...rest] = items.map((it) => ({ ...it, source: 'dining_hall', source_ref: String(it.id), detail: it.location })); setQueue(rest); setSelected(first); };
  const next = () => { if (queue.length) { const [n, ...rest] = queue; setQueue(rest); setSelected(n); } else setSelected(null); };

  const r = data?.remaining;
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.wrap}>
      <Text style={type.h1}>{data?.period || period || 'Now'}</Text>
      {r ? <Text style={type.small}>You still need <Text style={{ color: colors.protein, fontWeight: '600' }}>{Math.round(r.protein)}p</Text> · <Text style={{ color: colors.carbs, fontWeight: '600' }}>{Math.round(r.carbs)}c</Text> · <Text style={{ color: colors.fat, fontWeight: '600' }}>{Math.round(r.fat)}f</Text> today.</Text> : null}
      <Pressable onPress={() => setProteinFirst(!proteinFirst)} style={s.toggle}>
        <Text style={s.toggleText}>{proteinFirst ? 'Prioritizing protein' : 'Weighting all macros evenly'} · tap to switch</Text>
      </Pressable>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {loading ? <Text style={type.small}>Working through the menu…</Text> : null}
      {data?.mode === 'none' ? <Text style={type.body}>{data.reason}</Text> : null}
      {data?.mode === 'best_fit' ? <Text style={type.small}>Nothing on the menu lands inside the tolerance band, so these are the closest fits.</Text> : null}

      {(data?.suggestions || []).map((sug, i) => (
        <View key={i} style={[s.card, sug.fits && { borderColor: colors.maroon }]}>
          {sug.items.map((it, j) => (
            <View key={j} style={s.item}>
              <View style={{ flex: 1 }}>
                <Text style={type.body}>{it.name}</Text>
                <Text style={type.small}>{[it.location, it.station, it.portion].filter(Boolean).join(' · ')}</Text>
              </View>
              <Text style={s.itemMacros}>{Math.round(it.protein)}p {Math.round(it.carbs)}c {Math.round(it.fat)}f</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.total}>{sug.total.calories} kcal · {sug.total.protein}p {sug.total.carbs}c {sug.total.fat}f</Text>
            <Text style={type.small}>{fmtDelta(sug.delta)}</Text>
          </View>
          <Button title={sug.items.length > 1 ? `Log these ${sug.items.length}` : 'Log this'} variant="ghost" onPress={() => logCombo(sug.items)} />
        </View>
      ))}
      <LogSheet item={selected} onClose={next} />
    </ScrollView>
  );
}
const fmtDelta = (d) => ['protein', 'carbs', 'fat'].map((k) => `${d[k] >= 0 ? '+' : ''}${d[k]}${k[0]}`).join('  ');
const s = StyleSheet.create({
  wrap: { padding: 20, gap: 14, paddingBottom: 40 },
  toggle: { alignSelf: 'flex-start', backgroundColor: colors.maroonSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  toggleText: { color: colors.maroon, fontWeight: '600', fontSize: 13 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 10 },
  item: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  itemMacros: { ...type.small, fontVariant: ['tabular-nums'] },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  total: { fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'] },
});
