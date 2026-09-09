import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style }) {
  const primary = variant === 'primary';
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [s.base, primary ? s.primary : s.ghost, (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.8 }, style]}>
      {loading ? <ActivityIndicator color={primary ? '#fff' : colors.maroon} /> :
        <Text style={[s.label, { color: primary ? '#fff' : colors.maroon }]}>{title}</Text>}
    </Pressable>
  );
}
const s = StyleSheet.create({
  base: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.maroon },
  ghost: { backgroundColor: colors.maroonSoft },
  label: { fontSize: 16, fontWeight: '600' },
});
