import { FontAwesome } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';

export function GoogleButton() {
  return (
    <Pressable
      style={({ pressed }) => [styles.base, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() =>
        Alert.alert(
          'Indisponível',
          'Login com Google ainda não está disponível no aplicativo.',
        )
      }
    >
      <FontAwesome name="google" size={18} color="#EA4335" />
      <Text style={styles.label}>Google</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    color: colors.onSurface,
    fontWeight: '700',
    fontSize: 15,
  },
});