// Bottom sheet to confirm a food before it goes into the log: meal, servings, editable macros.
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../api';
import Button from './Button';
import { colors, radius, type } from '../theme';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const defaultMeal = () => { const h = new Date().getHours(); return h < 10.5 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack'; };

export default function LogSheet({ item, onClose, onLogged }) {
  const [meal, setMeal] = useState(defaultMeal());
  const [servings, setServings] = useState('1');
  const [m, setM] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item) { setServings('1'); setError(null); setM({ calories: String(item.calories ?? ''), protein: String(item.protein ?? ''), carbs: String(item.carbs ?? ''), fat: String(item.fat ?? '') }); }
  }, [item]);

  if (!item) return null;
  const save = async () => {
    setBusy(true); setError(null);
    try {
      const summary = await api('/log', { method: 'POST', body: {
        name: item.name, meal, source: item.source || 'manual', source_ref: item.source_ref, servings: Number(servings) || 1,
        calories: Number(m.calories) || 0, protein: Number(m.protein) || 0, carbs: Number(m.carbs) || 0, fat: Number(m.fat) || 0, estimated: !!item.estimated,
      } });
      onLogged?.(summary); onClose();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <Text style={type.h2} numberOfLines={2}>{item.name}</Text>
          {item.estimated ? <Text style={s.estNote}>These numbers are an estimate — adjust if you know better.</Text> : null}
          <View style={s.meals}>
            {MEALS.map((x) => (
              <Pressable key={x} onPress={() => setMeal(x)} style={[s.chip, meal === x && s.chipOn]}>
                <Text style={[s.chipText, meal === x && { color: '#fff' }]}>{x[0].toUpperCase() + x.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={s.grid}>
            <Field label="Servings" value={servings} onChange={setServings} />
            <Field label="kcal" value={m.calories} onChange={(v) => setM({ ...m, calories: v })} />
            <Field label="Protein g" value={m.protein} onChange={(v) => setM({ ...m, protein: v })} />
            <Field label="Carbs g" value={m.carbs} onChange={(v) => setM({ ...m, carbs: v })} />
            <Field label="Fat g" value={m.fat} onChange={(v) => setM({ ...m, fat: v })} />
          </View>
          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
          <Button title="Add to log" onPress={save} loading={busy} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, value, onChange }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" style={s.input} selectTextOnFocus />
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 20, paddingBottom: 36, gap: 16 },
  estNote: { color: colors.estimate, fontSize: 13 },
  meals: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.maroonSoft },
  chipOn: { backgroundColor: colors.maroon },
  chipText: { color: colors.maroon, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  field: { width: '30%', flexGrow: 1 },
  fieldLabel: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 10, fontSize: 16, color: colors.ink, backgroundColor: colors.bg },
});
