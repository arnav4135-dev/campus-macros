import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';
import { colors, type, radius } from '../theme';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const go = async () => {
    setBusy(true); setError(null);
    try { await (mode === 'login' ? login : register)(email.trim(), password); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.wrap}>
      <View style={s.brand}><Text style={s.brandText}>TAMU Macros</Text></View>
      <Text style={type.h1}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
      <Text style={type.small}>Dining hall menus, restaurant lookups and photo logging — all against your daily targets.</Text>
      <TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={s.input} placeholderTextColor={colors.muted} />
      <TextInput placeholder="Password (8+ characters)" secureTextEntry value={password} onChangeText={setPassword} style={s.input} placeholderTextColor={colors.muted} />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <Button title={mode === 'login' ? 'Sign in' : 'Create account'} onPress={go} loading={busy} />
      <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
        <Text style={s.switch}>{mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24, gap: 14, backgroundColor: colors.bg },
  brand: { alignSelf: 'flex-start', backgroundColor: colors.maroon, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, marginBottom: 8 },
  brandText: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, fontSize: 16, backgroundColor: colors.surface, color: colors.ink },
  switch: { color: colors.maroon, textAlign: 'center', fontWeight: '600', marginTop: 4 },
});
