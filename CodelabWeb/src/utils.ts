import { API_BASE_URL } from './constants'
import type { QuestionItem } from './types'

export function topicLabel(topic: QuestionItem['topic']) {
  return topic.replaceAll('_', ' ')
}

export function difficultyLabel(difficulty: QuestionItem['difficulty']) {
  if (difficulty === 'EASY') return 'Fácil'
  if (difficulty === 'MEDIUM') return 'Médio'
  return 'Difícil'
}

export function typeLabel(type: QuestionItem['type']) {
  return type === 'PRACTICAL' ? 'Prática' : 'Múltipla escolha'
}

export function resolvePhotoUrl(photo: string | null) {
  if (!photo) return 'https://via.placeholder.com/160x160?text=User'
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo
  if (photo.startsWith('/')) return `${API_BASE_URL}${photo}`
  return `${API_BASE_URL}/${photo}`
}
