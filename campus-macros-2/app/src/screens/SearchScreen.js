// One search bar across dining hall (current meal), cached restaurant menus, USDA and Open Food Facts.
// A second mode finds restaurants near campus and loads their menus (official → estimated).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { api, q } from '../api';
import FoodRow from '../components/FoodRow';
import LogSheet from '../components/LogSheet';
import { colors, type, radius } from '../theme';

const SOURCE_LABEL = { dining_hall: 'Dining hall', restaurant: 'Restaurant', usda: 'USDA', openfoodfacts: 'Open Food Facts' };

export default function SearchScreen() {
  const [mode, setMode] = useState('foods');
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [places, setPlaces] = useState([]);
  const [restaurant, setRestaurant] = useState(null);   // { restaurant, items, source }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (mode !== 'foods' || text.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try { setResults((await api(`/foods/search?${q({ q: text })}`)).results); setError(null); } catch (e) { setError(e.message); } finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timer.current);
  }, [text, mode]);

  const findPlaces = async () => {
    setLoading(true); setRestaurant(null);
    try { setPlaces(await api(`/restaurants/nearby?${q({ q: text })}`)); setError(null); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  const openPlace = async (p) => {
    setLoading(true);
    try { setRestaurant(await api(`/restaurants/${p.place_id}/menu?${q({ name: p.name })}`)); setError(null); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const header = (
    <View style={s.top}>
      <View style={s.modes}>
        {[['foods', 'Foods'], ['places', 'Restaurants near campus']].map(([m, l]) => (
          <Pressable key={m} onPress={() => { setMode(m); setRestaurant(null); }} style={[s.mode, mode === m && s.modeOn]}>
            <Text style={[s.modeText, mode === m && { color: '#fff' }]}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput value={text} onChangeText={setText} placeholder={mode === 'foods' ? 'Chicken breast, protein bar, Sbisa pizza…' : 'Search or leave blank for everything nearby'}
        placeholderTextColor={colors.muted} style={s.input} autoCorrect={false} returnKeyType="search" onSubmitEditing={mode === 'places' ? findPlaces : undefined} />
      {mode === 'places' && !restaurant ? <Pressable onPress={findPlaces} style={s.go}><Text style={s.goText}>Find restaurants</Text></Pressable> : null}
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {loading ? <Text style={type.small}>{mode === 'places' && !places.length ? 'Searching…' : restaurant === null && mode === 'places' ? 'Searching…' : 'Looking that up…'}</Text> : null}
      {restaurant ? (
        <View style={s.restHead}>
          <Pressable onPress={() => setRestaurant(null)}><Text style={s.back}>‹ Back to results</Text></Pressable>
          <Text style={type.h2}>{restaurant.restaurant.name}</Text>
          <Text style={type.small}>{restaurant.source === 'official' ? 'Published nutrition data.' : 'No published nutrition data — these are AI estimates from the menu and are cached for next time.'}</Text>
        </View>
      ) : null}
    </View>
  );

  if (mode === 'places' && !restaurant) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <FlatList data={places} keyExtractor={(p) => p.place_id} ListHeaderComponent={header}
          renderItem={({ item }) => (
            <Pressable onPress={() => openPlace(item)} style={s.place}>
              <View style={{ flex: 1 }}>
                <Text style={type.body}>{item.name}</Text>
                <Text style={type.small}>{item.address}{item.open_now === false ? ' · closed now' : ''}</Text>
              </View>
              <Text style={[s.tag, item.chain ? s.tagOfficial : item.cached ? s.tagCached : null]}>{item.chain ? 'official data' : item.cached ? 'cached' : 'estimate on open'}</Text>
            </Pressable>
          )}
          ListEmptyComponent={!loading ? <Text style={[type.small, { padding: 24, textAlign: 'center' }]}>Search covers a 3-mile radius around campus by default.</Text> : null} />
      </View>
    );
  }

  const list = restaurant
    ? restaurant.items.map((it) => ({ ...it, source: 'restaurant', source_ref: String(it.id), estimated: it.source === 'estimated', detail: restaurant.restaurant.name }))
    : results;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList data={list} keyExtractor={(it, i) => `${it.source}-${it.source_ref}-${i}`} ListHeaderComponent={header} keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <FoodRow item={{ ...item, detail: item.detail || SOURCE_LABEL[item.source] }} onPress={() => setSelected(item)} />}
        ListEmptyComponent={!loading && text.length >= 2 && mode === 'foods' ? <Text style={[type.small, { padding: 24, textAlign: 'center' }]}>Nothing matched. Try a simpler name, or log it manually from the row below.</Text> : null}
        ListFooterComponent={mode === 'foods' && text.length >= 2 ? (
          <Pressable onPress={() => setSelected({ name: text, source: 'manual', calories: 0, protein: 0, carbs: 0, fat: 0 })} style={s.manual}>
            <Text style={s.manualText}>Log "{text}" manually with your own numbers</Text>
          </Pressable>) : null} />
      <LogSheet item={selected} onClose={() => setSelected(null)} />
    </View>
  );
}
const s = StyleSheet.create({
  top: { padding: 16, gap: 10 },
  modes: { flexDirection: 'row', gap: 8 },
  mode: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.maroonSoft },
  modeOn: { backgroundColor: colors.maroon },
  modeText: { color: colors.maroon, fontWeight: '600', fontSize: 13 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, fontSize: 16, backgroundColor: colors.surface, color: colors.ink },
  go: { alignSelf: 'flex-start' }, goText: { color: colors.maroon, fontWeight: '600' },
  place: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line, gap: 10 },
  tag: { fontSize: 11, color: colors.muted, backgroundColor: colors.line, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tagOfficial: { color: '#fff', backgroundColor: colors.fat },
  tagCached: { color: colors.maroon, backgroundColor: colors.maroonSoft },
  restHead: { gap: 4 }, back: { color: colors.maroon, fontWeight: '600', marginBottom: 6 },
  manual: { padding: 16 }, manualText: { color: colors.maroon, fontWeight: '600', textAlign: 'center' },
});
