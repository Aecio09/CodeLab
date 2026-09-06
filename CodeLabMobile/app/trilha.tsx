import { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditProfileModal } from '@/components/edit-profile-modal';
import { colors } from '@/constants/colors';
import {
  fetchNextQuestionId,
  fetchTrailProgress,
  getCurrentUser,
  LessonLockedError,
  NoQuestionError,
  signOut,
} from '@/lib/api';
import { TOPIC_METADATA, type TopicStatus, type UserProfile } from '@/types';

const getXOffset = (index: number): number => {
  const pattern = [0, 24, 48, 24, 0, -24, -48, -24];
  return pattern[index % pattern.length];
};

const TOPIC_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  OPERADORES_TIPOS_E_VARIAVEIS: 'data-object',
  EXECUCAO_CONDICIONAL: 'code',
  OPERADORES_LOGICOS: 'compare-arrows',
  LACOS: 'loop',
  SUBPROGRAMAS: 'functions',
  VETORES: 'reorder',
  ARRAYS: 'view-module',
  TIPOS_CRIADOS_PELO_PROGRAMADOR: 'account-tree',
};

type LessonStatus = 'COMPLETED' | 'AVAILABLE' | 'LOCKED';

export default function StudentPathScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<TopicStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        const progressData = await fetchTrailProgress();
        setProgress(progressData);
      } catch {
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [router]);

  const handleNavigate = async (topic: string) => {
    try {
      const id = await fetchNextQuestionId(topic);
      router.push({ pathname: '/playground/[id]', params: { id: String(id) } });
    } catch (err) {
      if (err instanceof LessonLockedError) {
        Alert.alert('Bloqueado', 'Esta lição ainda está bloqueada para você!');
      } else if (err instanceof NoQuestionError) {
        Alert.alert('Aviso', 'Nenhuma questão disponível para esta lição no momento.');
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando Sua Jornada...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerStats}>
          <View style={styles.chip}>
            <MaterialIcons name="local-fire-department" size={18} color={colors.streak} />
            <Text style={styles.chipText}>{user.userStreak}</Text>
          </View>
          <View style={styles.chip}>
            <MaterialIcons name="stars" size={18} color={colors.star} />
            <Text style={styles.chipText}>{Math.floor(user.userPoints)}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push('/playground')}
          >
            <MaterialIcons name="terminal" size={20} color={colors.onSurface} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setModalOpen(true)}
          >
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {progress.map((unit, unitIndex) => {
          const meta = TOPIC_METADATA[unit.topicName] ?? { label: unit.topicName, icon: 'help' };
          const progressPct =
            (unit.totalActivitiesCompleted / (unit.totalLessons * 2)) * 100;
          const isLocked = unit.status === 'LOCKED';
          const iconName = TOPIC_ICON[unit.topicName] ?? 'help';

          return (
            <View key={unit.topicName} style={[styles.unit, isLocked && styles.unitLocked]}>
              <View style={styles.unitHeader}>
                <Text style={styles.unitLabel}>Unidade {unitIndex + 1}</Text>
                <Text style={styles.unitTitle}>{meta.label}</Text>
                <View style={styles.masteryRow}>
                  <Text style={styles.masteryLabel}>Maestria</Text>
                  <Text style={styles.masteryPct}>{Math.round(progressPct)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                </View>
              </View>

              <View style={styles.pathArea}>
                {Array.from({ length: unit.totalLessons }).map((_, lessonIdx) => {
                  const lessonNum = lessonIdx + 1;
                  let lessonStatus: LessonStatus = 'LOCKED';

                  if (unit.status === 'COMPLETED') {
                    lessonStatus = 'COMPLETED';
                  } else if (unit.status === 'AVAILABLE') {
                    if (lessonNum < unit.currentLesson) lessonStatus = 'COMPLETED';
                    else if (lessonNum === unit.currentLesson) lessonStatus = 'AVAILABLE';
                  }

                  const xOffset = getXOffset(lessonIdx);
                  const isCompleted = lessonStatus === 'COMPLETED';
                  const isAvailable = lessonStatus === 'AVAILABLE';
                  const bubbleIcon =
                    lessonStatus === 'LOCKED'
                      ? ('lock' as keyof typeof MaterialIcons.glyphMap)
                      : isCompleted
                        ? ('check' as keyof typeof MaterialIcons.glyphMap)
                        : iconName;

                  return (
                    <View
                      key={`${unit.topicName}-${lessonNum}`}
                      style={[styles.nodeRow, { transform: [{ translateX: xOffset }] }]}
                    >
                      {lessonIdx > 0 && (
                        <View
                          style={[
                            styles.connectorLine,
                            isLocked ? styles.lineLocked : styles.lineActive,
                          ]}
                        />
                      )}
                      <View style={styles.nodeWrapper}>
                        <Pressable
                          disabled={isLocked}
                          onPress={() => handleNavigate(unit.topicName)}
                          style={({ pressed }) => [
                            styles.node,
                            lessonStatus === 'LOCKED'
                              ? styles.nodeLocked
                              : isCompleted
                                ? styles.nodeCompleted
                                : styles.nodeAvailable,
                            pressed &&
                              !isLocked && {
                                transform: [{ scale: 1.1 }],
                                opacity: 0.8,
                              },
                          ]}
                        >
                          <MaterialIcons
                            name={bubbleIcon}
                            size={28}
                            color={
                              lessonStatus === 'LOCKED'
                                ? colors.outline
                                : isCompleted
                                  ? colors.onPrimary
                                  : colors.onPrimaryContainer
                            }
                          />
                          <View style={styles.nodeBadge}>
                            <Text style={styles.nodeBadgeText}>{lessonNum}</Text>
                          </View>
                        </Pressable>

                        {isAvailable && (
                          <View style={styles.availableTag}>
                            <Text style={styles.availableTagText}>LIÇÃO ATUAL</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <EditProfileModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        user={user}
        onUpdate={setUser}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: colors.primary, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surfaceLow,
  },
  headerStats: { flexDirection: 'row', gap: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 6,
  },
  chipText: { color: colors.onSurface, fontWeight: '800', fontSize: 14 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInitial: { color: colors.onPrimaryContainer, fontWeight: '800', fontSize: 14 },
  body: { paddingVertical: 32, paddingHorizontal: 16, gap: 48, alignItems: 'center' },
  unit: { width: '100%' },
  unitLocked: { opacity: 0.3 },
  unitHeader: {
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 4,
    marginBottom: 24,
  },
  unitLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  unitTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    marginTop: 2,
  },
  masteryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  masteryLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  masteryPct: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    backgroundColor: colors.surfaceHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 999 },
  pathArea: { alignItems: 'center', paddingBottom: 32 },
  nodeRow: { alignItems: 'center', marginBottom: 0 },
  connectorLine: { width: 4, height: 40, borderRadius: 2 },
  lineActive: { backgroundColor: colors.surfaceHigh },
  lineLocked: { backgroundColor: colors.surfaceContainer },
  nodeWrapper: { alignItems: 'center' },
  node: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  nodeLocked: { backgroundColor: colors.surfaceLow, borderColor: colors.surfaceHighest },
  nodeCompleted: { backgroundColor: colors.primary, borderColor: '#1a3a2a' },
  nodeAvailable: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  nodeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  availableTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  availableTagText: { color: colors.onPrimary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});