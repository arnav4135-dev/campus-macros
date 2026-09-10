// Today's dining hall menus, one meal period at a time, grouped by location → station.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, SectionList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { api, q } from '../api';
import FoodRow from '../components/FoodRow';
import LogSheet from '../components/LogSheet';
import Button from '../components/Button';
import { colors, type } from '../theme';

const PERIODS = ['Breakfast', 'Lunch', 'Dinner'];
const now = () => { const h = new Date().getHours(); return h < 10.5 ? 'Breakfast' : h < 16 ? 'Lunch' : 'Dinner'; };

export default function MenuScreen({ navigation }) {
  const [period, setPeriod] = useState(now());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api(`/menus?${q({ period })}`)); setError(null); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try { await api('/menus/refresh', { method: 'POST' }); await load(); } catch (e) { setError(e.message); } finally { setRefreshing(false); }
  };

  const sections = (data?.snapshots || []).filter((sn) => sn.status === 'ok' && sn.items.length).map((sn) => ({
    title: `${sn.location_name}${sn.period_name === 'Everyday' ? ' · Everyday' : ''}`,
    data: sn.items.map((it) => ({ ...it, source: 'dining_hall', source_ref: String(it.id), detail: it.station })),
  }));
  const closed = (data?.snapshots || []).filter((sn) => sn.status === 'closed').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.tabs}>
        {PERIODS.map((p) => (
          <Pressable key={p} onPress={() => setPeriod(p)} style={[s.tab, period === p && s.tabOn]}>
            <Text style={[s.tabText, period === p && { color: colors.maroon }]}>{p}</Text>
          </Pressable>
        ))}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(it) => String(it.id)}
        refreshControl={<RefreshControl refreshing={loading || refreshing} onRefresh={refresh} />}
        renderSectionHeader={({ section }) => <Text style={s.section}>{section.title}</Text>}
        renderItem={({ item }) => <FoodRow item={item} onPress={() => setSelected(item)} />}
        stickySectionHeadersEnabled
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 8 }}>
            {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
            {data?.message ? <Text style={type.small}>{data.message}</Text> : null}
            {closed ? <Text style={type.small}>{closed} location{closed > 1 ? 's' : ''} closed for {period.toLowerCase()}.</Text> : null}
            {data?.last_scrape ? <Text style={type.small}>Menus pulled {new Date(data.last_scrape.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Pull down to refresh.</Text> : null}
            <Button title={`Recommend for ${period.toLowerCase()}`} variant="ghost" onPress={() => navigation.navigate('Recommend', { period })} />
          </View>
        }
        ListEmptyComponent={!loading ? <Text style={[type.small, { padding: 24, textAlign: 'center' }]}>No {period.toLowerCase()} menu loaded yet. Pull down to fetch from DineOnCampus.</Text> : null}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      <LogSheet item={selected} onClose={() => setSelected(null)} />
    </View>
  );
}
const s = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  tabOn: { borderColor: colors.maroon },
  tabText: { fontWeight: '600', color: colors.muted },
  section: { ...type.h2, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
});
