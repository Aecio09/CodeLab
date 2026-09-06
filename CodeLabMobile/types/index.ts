export type UserProfile = {
  id: number;
  name: string;
  email: string;
  photo: string | null;
  role: string;
  userStreak: number;
  userPoints: number;
};

export type TopicStatus = {
  topicName: string;
  status: 'COMPLETED' | 'AVAILABLE' | 'LOCKED';
  currentLesson: number;
  totalLessons: number;
  activitiesInCurrentLesson: number;
  totalActivitiesCompleted: number;
};

export const TOPIC_METADATA: Record<string, { label: string; icon: string }> = {
  OPERADORES_TIPOS_E_VARIAVEIS: { label: 'Variáveis e Tipos', icon: 'variable-box' },
  EXECUCAO_CONDICIONAL: { label: 'Condicionais', icon: 'code-braces' },
  OPERADORES_LOGICOS: { label: 'Lógica', icon: 'brain' },
  LACOS: { label: 'Laços de Repetição', icon: 'reorder' },
  SUBPROGRAMAS: { label: 'Funções', icon: 'function-variant' },
  VETORES: { label: 'Vetores', icon: 'view-module' },
  ARRAYS: { label: 'Arrays', icon: 'view-module' },
  TIPOS_CRIADOS_PELO_PROGRAMADOR: { label: 'Estruturas', icon: 'file-tree' },
};