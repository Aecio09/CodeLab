export type UserProfile = {
  id: number
  name: string
  email: string
  photo: string | null
  role: string
  userStreak: number
  userPoints: number
}

export type QuestionItem = {
  id: number
  questionBody: string
  type: 'MULTIPLE_CHOICE' | 'PRACTICAL'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  requiredUsage: string | null
  topic:
    | 'OPERADORES_TIPOS_E_VARIAVEIS'
    | 'EXECUCAO_CONDICIONAL'
    | 'OPERADORES_LOGICOS'
    | 'LACOS'
    | 'SUBPROGRAMAS'
    | 'VETORES'
    | 'ARRAYS'
    | 'TIPOS_CRIADOS_PELO_PROGRAMADOR'
  starterCode: string | null
}

export type QuestionPayload = {
  questionBody: string
  type: QuestionItem['type']
  difficulty: QuestionItem['difficulty']
  requiredUsage: string | null
  topic: QuestionItem['topic']
}

export type QuestionSeedImportResponse = {
  sourceFile: string
  extractedQuestions: number
  insertedQuestions: number
  seedQuestionsTotal: number
}

export type AnswerReviewResponse = {
  id: number
  answerBody: string
  verificationStatus: string
  nodeVerificationResult: string | null
  aiVerificationResult: string | null
}

export type ReviewApiError = {
  code: string
  message: string
  status: number
}

export type TopicStatus = {
  topicName: string
  status: 'COMPLETED' | 'AVAILABLE' | 'LOCKED'
  currentLesson: number
  totalLessons: number
  activitiesInCurrentLesson: number
  totalActivitiesCompleted: number
}
