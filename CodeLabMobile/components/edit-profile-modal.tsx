import { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthInput } from '@/components/auth-input';
import { Button } from '@/components/button';
import { colors } from '@/constants/colors';
import { deleteAccount, updateProfile } from '@/lib/api';
import type { UserProfile } from '@/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdate: (updated: UserProfile) => void;
};

export function EditProfileModal({ visible, onClose, user, onUpdate }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPassword('');
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateProfile({ name, email, password: password || undefined });
      onUpdate(updated);
      onClose();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('TEM CERTEZA?', 'Esta ação é irreversível.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            router.replace('/');
          } catch {
            Alert.alert('Erro', 'Não foi possível deletar a conta.');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Editar Perfil</Text>
              <Text style={styles.subtitle}>Atualize suas informações</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            <AuthInput label="Nome Completo" value={name} onChangeText={setName} />
            <AuthInput
              label="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <AuthInput
              label="Nova Senha (opcional)"
              secureTextEntry
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />
            <View style={styles.footerActions}>
              <Button onPress={handleSave} loading={loading} style={{ flex: 1 }}>
                Salvar Alterações
              </Button>
              <Button variant="danger" onPress={handleDelete} style={{ flex: 1 }}>
                Deletar Conta
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surfaceHigh,
  },
  title: { color: colors.onSurface, fontSize: 20, fontWeight: '700' },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  body: { padding: 16, gap: 16 },
  footerActions: { gap: 12, marginTop: 8 },
});