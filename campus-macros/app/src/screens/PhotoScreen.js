// Snap or pick a meal photo → server asks Claude for a per-item estimate → confirm/edit → log.
import React, { useState } from 'react';
import { ScrollView, View, Text, Image, TextInput, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api';
import Button from '../components/Button';
import LogSheet from '../components/LogSheet';
import FoodRow from '../components/FoodRow';
import { colors, type, radius } from '../theme';

export default function PhotoScreen() {
  const [photo, setPhoto] = useState(null);
  const [hint, setHint] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [queue, setQueue] = useState([]);

  const pick = async (camera) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError('Permission needed to use the camera or photo library.'); return; }
    const opts = { quality: 0.6, base64: true, allowsEditing: false, mediaTypes: ['images'] };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets?.[0]) { setPhoto(res.assets[0]); setResult(null); setError(null); }
  };

  const estimate = async () => {
    setBusy(true); setError(null);
    try {
      const mediaType = photo.mimeType || (photo.uri?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      setResult(await api('/photo/estimate', { method: 'POST', body: { image: photo.base64, mediaType, hint } }));
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const logAll = () => {
    const items = result.items.map((it) => ({ ...it, source: 'photo', estimated: true }));
    const [first, ...rest] = items; setQueue(rest); setSelected(first);
  };
  const next = () => { if (queue.length) { const [n, ...rest] = queue; setQueue(rest); setSelected(n); } else setSelected(null); };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Text style={type.h1}>Snap a plate</Text>
      <Text style={type.small}>You'll get a per-item estimate to confirm or fix before anything hits your log. Estimates are labeled everywhere they show up.</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Camera" onPress={() => pick(true)} style={{ flex: 1 }} />
        <Button title="Photo library" variant="ghost" onPress={() => pick(false)} style={{ flex: 1 }} />
      </View>
      {photo ? <Image source={{ uri: photo.uri }} style={s.img} resizeMode="cover" /> : null}
      {photo ? (
        <>
          <TextInput value={hint} onChangeText={setHint} placeholder="Optional context: 'Sbisa lunch, 2 scoops rice'…" placeholderTextColor={colors.muted} style={s.input} />
          <Button title="Estimate macros" onPress={estimate} loading={busy} />
        </>
      ) : null}
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {result ? (
        <View style={s.card}>
          <Text style={type.h2}>{result.total.calories} kcal · {result.total.protein}p {result.total.carbs}c {result.total.fat}f</Text>
          <Text style={type.small}>Confidence: {result.confidence}.{result.notes ? ` ${result.notes}` : ''}</Text>
          {result.items.map((it, i) => <FoodRow key={i} item={{ ...it, estimated: true }} onPress={() => setSelected({ ...it, source: 'photo', estimated: true })} />)}
          <Button title={`Log all ${result.items.length} item${result.items.length > 1 ? 's' : ''}`} onPress={logAll} />
          <Text style={type.small}>Or tap one item to log just that.</Text>
        </View>
      ) : null}
      <LogSheet item={selected} onClose={next} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  wrap: { padding: 20, gap: 14, paddingBottom: 40 },
  img: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.line },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, fontSize: 15, backgroundColor: colors.surface, color: colors.ink },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 10 },
});
