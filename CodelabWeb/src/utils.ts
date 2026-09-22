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

export function resolvePhotoUrl(photo: string | null | undefined, name?: string) {

  if (!photo || photo === 'null' || photo.trim() === '') {
    const fallbackName = name ? encodeURIComponent(name) : 'User'
    return `https://ui-avatars.com/api/?name=${fallbackName}&background=2f3633&color=72db9f&size=160`
  }


  if (photo.startsWith('http://') || photo.startsWith('https://')) {
    return photo
  }


  let finalPath = photo;
  if (!finalPath.startsWith('/')) {
    finalPath = `/uploads/${finalPath}`;
  }

  return `${API_BASE_URL}${finalPath}`
}