import { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput } from '@/components/auth-input';
import { Button } from '@/components/button';
import { GoogleButton } from '@/components/google-button';
import { colors } from '@/constants/colors';
import { getCurrentUser, signIn } from '@/lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ registered?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(() => router.replace('/trilha'))
      .catch(() => {});
  }, [router]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace('/trilha');
    } catch {
      Alert.alert('Erro', 'Email ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.logoRow}>
              <MaterialIcons name="terminal" size={32} color={colors.primary} />
              <Text style={styles.brand}>CodeLab</Text>
            </View>
            <Text style={styles.heading}>Bem-vindo de volta</Text>
            <Text style={styles.sub}>Aprenda lógica de programação como em um jogo</Text>

            {params.registered === '1' ? (
              <Text style={styles.success}>Cadastro realizado. Faça login para continuar.</Text>
            ) : null}

            <View style={styles.form}>
              <AuthInput
                label="Email"
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <View>
                <AuthInput
                  label="Senha"
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable hitSlop={8} onPress={() => Alert.alert('Recuperação', 'Entre em contato com o suporte para redefinir sua senha.')}>
                  <Text style={styles.forgot}>Esqueci minha senha</Text>
                </Pressable>
              </View>
              <Button onPress={handleSubmit} loading={submitting}>
                Entrar na conta
              </Button>
            </View>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>ou entre com</Text>
              <View style={styles.line} />
            </View>

            <GoogleButton />

            <View style={styles.registerRow}>
              <Text style={styles.muted}>Não tem uma conta?</Text>
              <Pressable onPress={() => router.push('/register')} hitSlop={8}>
                <Text style={styles.link}>Crie uma agora</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  brand: { color: colors.primary, fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  heading: { color: colors.onSurface, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.onSurfaceVariant, fontSize: 14, textAlign: 'center' },
  success: { color: colors.primary, fontSize: 14, textAlign: 'center' },
  form: { gap: 16, marginTop: 8 },
  forgot: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  dividerText: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: 16,
  },
  muted: { color: colors.onSurfaceVariant, fontSize: 14 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});