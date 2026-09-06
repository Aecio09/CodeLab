import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';

type Props = Omit<PressableProps, 'children'> & {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  children: ReactNode;
};

export function Button({ variant = 'primary', loading = false, children, style, disabled, ...props }: Props) {
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.errorContainer
        : colors.surfaceHigh;

  const textColor =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'danger'
        ? colors.onErrorContainer
        : colors.onSurface;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, opacity: pressed || disabled ? 0.7 : 1 },
        style as ViewStyle,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});