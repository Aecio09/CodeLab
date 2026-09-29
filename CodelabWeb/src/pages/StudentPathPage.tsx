import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import { authFetch, apiLogout } from '../lib/api'
import type { TopicStatus, UserProfile } from '../types'
import { EditProfileModal } from '../components/EditProfileModal'
import { AppSidebar } from '../components/AppSidebar'
import { resolvePhotoUrl } from '../utils.ts'

const TOPIC_METADATA: Record<string, { label: string; icon: string }> = {
  OPERADORES_TIPOS_E_VARIAVEIS: { label: 'Variáveis e Tipos', icon: 'variables' },
  EXECUCAO_CONDICIONAL: { label: 'Condicionais', icon: 'data_object' },
  OPERADORES_LOGICOS: { label: 'Lógica', icon: 'rule' },
  LACOS: { label: 'Laços de Repetição', icon: 'alt_route' },
  SUBPROGRAMAS: { label: 'Funções', icon: 'functions' },
  VETORES: { label: 'Vetores', icon: 'reorder' },
  ARRAYS: { label: 'Arrays', icon: 'view_module' },
  TIPOS_CRIADOS_PELO_PROGRAMADOR: { label: 'Estruturas', icon: 'account_tree' },
}

type LessonState = 'COMPLETED' | 'AVAILABLE' | 'LOCKED'

const LESSON_STATE_LABEL: Record<LessonState, string> = {
  COMPLETED: 'Concluída',
  AVAILABLE: 'Atual',
  LOCKED: 'Bloqueada',
}

const LESSON_STATE_ICON: Record<LessonState, string> = {
  COMPLETED: 'check',
  AVAILABLE: 'play_arrow',
  LOCKED: 'lock',
}

function getLessonStates(unit: TopicStatus): LessonState[] {
  return Array.from({ length: unit.totalLessons }, (_, index) => {
    const lessonNum = index + 1
    if (unit.status === 'COMPLETED') return 'COMPLETED'
    if (unit.status !== 'AVAILABLE') return 'LOCKED'
    if (lessonNum < unit.currentLesson) return 'COMPLETED'
    if (lessonNum === unit.currentLesson) return 'AVAILABLE'
    return 'LOCKED'
  })
}

function getMasteryPercent(unit: TopicStatus): number {
  const total = unit.totalLessons * 2
  if (total === 0) return 0
  return Math.min(100, Math.round((unit.totalActivitiesCompleted / total) * 100))
}

function StatBadge({
  icon,
  value,
  accent,
  label,
}: {
  icon: string
  value: string | number
  accent: string
  label: string
}) {
  return (
    <div className="flex items-center gap-2 border border-outline-variant px-3 py-1.5">
      <span
        className={`material-symbols-outlined text-lg ${accent}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="font-mono text-sm text-primary">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  )
}

function LessonRow({
  unit,
  lessonNum,
  state,
  isFirst,
  isLast,
  connectorSolid,
  topicIcon,
  onNavigate,
}: {
  unit: TopicStatus
  lessonNum: number
  state: LessonState
  isFirst: boolean
  isLast: boolean
  connectorSolid: boolean
  topicIcon: string
  onNavigate: (topicKey: string) => void
}) {
  const locked = state === 'LOCKED'
  const isCurrent = state === 'AVAILABLE'

  const nodeClass = state === 'COMPLETED'
    ? 'border-primary bg-primary text-on-primary'
    : isCurrent
      ? 'border-primary bg-background text-primary'
      : 'border-outline-variant bg-background text-on-surface-variant'

  const nodeIcon = state === 'COMPLETED' ? 'check' : locked ? 'lock' : topicIcon

  const rowBody = (
    <>
      <div className="relative flex w-10 shrink-0 self-stretch justify-center">
        {!isFirst && (
          <span
            aria-hidden="true"
            className={`absolute left-1/2 top-0 w-px -translate-x-1/2 ${isLast ? 'h-1/2' : 'h-full'} ${
              connectorSolid ? 'bg-primary' : 'bg-outline-variant'
            }`}
          />
        )}
        <span
          aria-hidden="true"
          className={`relative z-10 mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border ${nodeClass}`}
        >
          <span className="material-symbols-outlined text-lg">{nodeIcon}</span>
        </span>
      </div>

      <div className="min-w-0 flex-1 pb-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-mono text-xs text-on-surface-variant">
            {String(lessonNum).padStart(2, '0')}
          </span>
          <span className={`text-lg ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>
            Lição {String(lessonNum).padStart(2, '0')}
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-xs uppercase tracking-widest text-on-surface-variant">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              {LESSON_STATE_ICON[state]}
            </span>
            {LESSON_STATE_LABEL[state]}
          </span>
        </div>

        {isCurrent && (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 border border-primary bg-primary px-3 py-1.5 text-sm text-on-primary">
              Continuar
              <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
            </span>
            <span className="font-mono text-xs text-on-surface-variant">
              {unit.currentLesson} de {unit.totalLessons}
            </span>
          </div>
        )}
      </div>
    </>
  )

  if (locked) {
    return (
      <li className="flex gap-5">{rowBody}</li>
    )
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onNavigate(unit.topicName)}
        className="flex w-full gap-5 rounded-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        {rowBody}
      </button>
    </li>
  )
}

export function StudentPathPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<TopicStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await authFetch(`${API_BASE_URL}/api/users/me`)
        if (!userRes.ok) throw new Error('Não autenticado')
        const userData = (await userRes.json()) as UserProfile
        setUser(userData)
        setAvatarFailed(false)

        const progressRes = await authFetch(`${API_BASE_URL}/api/trail/progress`)
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          setProgress(progressData)
        }
      } catch (err) {
        console.error(err)
        window.location.href = '/'
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = () => { apiLogout() }

  const handleNavigateToPlayground = async (topicKey: string) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/questions/next?topic=${topicKey}`)
      if (res.ok) {
        const nextQuestion = await res.json()
        window.location.href = `/playground/${nextQuestion.id}`
      } else if (res.status === 403) {
        alert('Esta lição ainda está bloqueada para você!')
      } else {
        alert('Nenhuma questão disponível para esta lição no momento.')
      }
    } catch (error) {
      console.error('Erro ao buscar próxima questão:', error)
    }
  }

  if (loading || !user)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-mono text-primary" role="status" aria-live="polite">
        Carregando sua trilha...
      </div>
    )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-on-surface">
      <AppSidebar
        items={[
          { key: 'trilha', label: 'Minha Trilha', icon: 'map', href: '/trilha' },
          { key: 'playground', label: 'Playground', icon: 'terminal', href: '/playground' },
          { key: 'perfil', label: 'Meu Perfil', icon: 'account_circle', onClick: () => setIsProfileModalOpen(true) },
        ]}
        activeKey="trilha"
        onLogout={handleLogout}
      />

      <main className="ml-[var(--sidebar-w)] flex h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant px-8">
          <div className="flex items-center gap-3">
            <StatBadge icon="local_fire_department" accent="text-orange-500" value={user.userStreak} label="dias de sequência" />
            <StatBadge icon="stars" accent="text-yellow-500" value={Math.floor(user.userPoints)} label="pontos acumulados" />
          </div>

      <button
        onClick={() => setIsProfileModalOpen(true)}
        className="h-10 w-10 overflow-hidden border border-outline-variant transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="sr-only">Abrir meu perfil</span>
        {avatarFailed ? (
          <span className="flex h-full w-full items-center justify-center" aria-hidden="true">
            <span className="material-symbols-outlined text-xl text-outline">person</span>
          </span>
        ) : (
          <img
            alt=""
            className="h-full w-full object-cover"
            src={resolvePhotoUrl(user?.photo, user?.name)}
            onError={() => setAvatarFailed(true)}
          />
        )}
      </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-16">
          {progress.map((unit, unitIndex) => {
            const meta = TOPIC_METADATA[unit.topicName] || { label: unit.topicName, icon: 'help' }
            const states = getLessonStates(unit)
            const completedCount = states.filter((state) => state === 'COMPLETED').length
            const mastery = getMasteryPercent(unit)
            const isUnitLocked = unit.status === 'LOCKED'

            return (
              <section key={unit.topicName} className="border-b border-outline-variant last:border-b-0">
                <div className="sticky top-0 z-20 border-b border-outline-variant bg-background px-8 py-5">
                  <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-on-surface-variant">
                        Unidade {String(unitIndex + 1).padStart(2, '0')}
                        {isUnitLocked && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">lock</span>
                            Bloqueada
                          </span>
                        )}
                      </p>
                      <h2 className="mt-1 font-serif text-2xl text-primary">{meta.label}</h2>
                    </div>

                    <div className="w-full max-w-xs shrink-0">
                      <div className="flex items-baseline justify-between font-mono text-xs text-on-surface-variant">
                        <span>{completedCount} de {unit.totalLessons} lições</span>
                        <span>{mastery}%</span>
                      </div>
                      <div className="mt-2 h-1 w-full bg-outline-variant">
                        <div
                          className="h-full bg-primary transition-[width] duration-500"
                          style={{ width: `${mastery}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <ol className="px-8 pt-8">
                  {states.map((state, lessonIdx) => (
                    <LessonRow
                      key={`${unit.topicName}-${lessonIdx + 1}`}
                      unit={unit}
                      lessonNum={lessonIdx + 1}
                      state={state}
                      isFirst={lessonIdx === 0}
                      isLast={lessonIdx === states.length - 1}
                      connectorSolid={lessonIdx > 0 && states[lessonIdx - 1] === 'COMPLETED'}
                      topicIcon={meta.icon}
                      onNavigate={handleNavigateToPlayground}
                    />
                  ))}
                </ol>
              </section>
            )
          })}
        </div>
      </main>

      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdate={(updated) => setUser(updated)}
      />
    </div>
  )
}
