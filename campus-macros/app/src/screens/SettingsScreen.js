import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import ProfileSetupScreen from './ProfileSetupScreen';
import Button from '../components/Button';
import { colors, type, radius } from '../theme';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [existing, setExisting] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const load = useCallback(async () => { try { setExisting(await api('/profile')); } catch { /* ignore */ } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (editing) return <ProfileSetupScreen existing={existing} onDone={() => { setEditing(false); setSaved(true); load(); }} />;
  const t = existing?.targets;
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.wrap}>
      <Text style={type.h1}>You</Text>
      <View style={s.card}>
        <Text style={type.h2}>Daily targets</Text>
        {t ? <Text style={type.body}>{t.calories} kcal · {t.protein}p · {t.carbs}c · {t.fat}f{t.is_override ? ' (today only)' : ''}</Text> : <Text style={type.small}>Not set yet.</Text>}
        {saved ? <Text style={{ color: colors.fat }}>Targets saved.</Text> : null}
        <Button title={t ? 'Change stats or targets' : 'Set up targets'} variant="ghost" onPress={() => { setSaved(false); setEditing(true); }} />
      </View>
      <View style={s.card}>
        <Text style={type.h2}>About the data</Text>
        <Text style={type.small}>Dining hall menus come from DineOnCampus (unofficial — the site can change without warning). Chains use their published nutrition guides. Anything marked "est." is an AI estimate from a menu or photo; edit it if you know better.</Text>
      </View>
      <Button title="Sign out" variant="ghost" onPress={logout} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  wrap: { padding: 20, gap: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 10 },
});
