import { API_BASE_URL } from '@/constants/api';
import type { TopicStatus, UserProfile } from '@/types';

export class LessonLockedError extends Error {}
export class NoQuestionError extends Error {}

export function resolvePhotoUrl(photo: string | null): string {
  if (!photo) return '';
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  if (photo.startsWith('/')) return `${API_BASE_URL}${photo}`;
  return `${API_BASE_URL}/${photo}`;
}

export async function getCurrentUser(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/users/me`);
  if (!response.ok) throw new Error('Não autenticado');
  return (await response.json()) as UserProfile;
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
  }).catch(() => {});
  return getCurrentUser();
}

export async function signOut(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/logout`, { method: 'POST' });
  } catch {}
}

export async function registerUser(name: string, email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) throw new Error('Não foi possível criar a conta agora.');
}

export async function fetchTrailProgress(): Promise<TopicStatus[]> {
  const response = await fetch(`${API_BASE_URL}/api/trail/progress`);
  if (!response.ok) throw new Error('Não autenticado');
  return (await response.json()) as TopicStatus[];
}

export async function fetchNextQuestionId(topic: string): Promise<number> {
  const response = await fetch(
    `${API_BASE_URL}/questions/next?topic=${encodeURIComponent(topic)}`,
  );
  if (response.status === 403) throw new LessonLockedError();
  if (!response.ok) throw new NoQuestionError();
  const data = (await response.json()) as { id: number };
  return data.id;
}

export async function updateProfile(data: {
  name: string;
  email: string;
  password?: string;
}): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/users/perfil`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Falha ao atualizar perfil');
  return (await response.json()) as UserProfile;
}

export async function deleteAccount(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/users/perfil`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Erro ao deletar conta');
}