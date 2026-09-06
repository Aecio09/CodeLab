import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

export default function PlaygroundQuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desafio {id}</Text>
      <Text style={styles.sub}>Em breve</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { color: colors.onSurface, fontSize: 20, fontWeight: '800' },
  sub: { color: colors.onSurfaceVariant, fontSize: 14 },
});