import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
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
import { registerUser } from '@/lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!acceptTerms) {
      setError('Você precisa aceitar os termos para continuar.');
      return;
    }
    setSubmitting(true);
    try {
      await registerUser(name, email, password);
      router.replace({ pathname: '/', params: { registered: '1' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível conectar ao servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.heading}>Começar agora</Text>
            <Text style={styles.sub}>Crie sua conta no CodeLab e domine a lógica</Text>

            <View style={styles.form}>
              <AuthInput
                label="Nome Completo"
                placeholder="Ex: João Silva"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
              <AuthInput
                label="E-mail"
                placeholder="nome@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <View style={styles.row}>
                <View style={styles.half}>
                  <AuthInput
                    label="Senha"
                    placeholder="••••••••"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                <View style={styles.half}>
                  <AuthInput
                    label="Confirmar Senha"
                    placeholder="••••••••"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>
              <Pressable style={styles.terms} onPress={() => setAcceptTerms(!acceptTerms)}>
                <MaterialIcons
                  name={acceptTerms ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.termsText}>
                  Eu aceito os <Text style={styles.termsLink}>termos de serviço</Text> e a{' '}
                  <Text style={styles.termsLink}>política de privacidade</Text> do CodeLab.
                </Text>
              </Pressable>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button onPress={handleSubmit} loading={submitting}>
                Criar Conta
              </Button>
            </View>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>Ou registre-se com</Text>
              <View style={styles.line} />
            </View>

            <GoogleButton />

            <View style={styles.loginRow}>
              <Text style={styles.muted}>Já possui uma conta?</Text>
              <Pressable onPress={() => router.replace('/')} hitSlop={8}>
                <Text style={styles.link}>Fazer Login</Text>
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
  heading: { color: colors.onSurface, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.onSurfaceVariant, fontSize: 14, textAlign: 'center' },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  termsText: { color: colors.onSurfaceVariant, fontSize: 13, flex: 1, lineHeight: 18 },
  termsLink: { color: colors.primary, fontWeight: '700' },
  error: { color: colors.error, fontWeight: '700', fontSize: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  dividerText: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loginRow: {
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