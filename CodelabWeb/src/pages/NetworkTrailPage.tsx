import { useEffect, useState } from 'react'
import { apiLogout } from '../lib/api'
import { getNetworkTrail } from '../lib/networkLabApi'
import { useUserProfile } from '../hooks/useUserProfile'
import { NetworkSidebar } from '../components/network/NetworkSidebar'
import { EditProfileModal } from '../components/EditProfileModal'
import type {
  LabStatus,
  NetworkTrailItem,
  NetworkTrailResponse,
} from '../types/network'

const TOPIC_META: Record<string, { label: string; icon: string; description: string }> = {
  BASIC_NETWORKING: {
    label: 'Redes Básicas',
    icon: 'lan',
    description: 'Endereçamento IP, switches, VLANs e roteamento.',
  },
}

const DIFFICULTY_META: Record<string, { label: string; className: string }> = {
  EASY: { label: 'Fácil', className: 'border-primary/40 bg-primary/10 text-primary' },
  MEDIUM: { label: 'Médio', className: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300' },
  HARD: { label: 'Difícil', className: 'border-error/40 bg-error/10 text-error' },
}

const STATUS_META: Record<LabStatus, { icon: string; label: string }> = {
  COMPLETED: { icon: 'check_circle', label: 'Concluído' },
  AVAILABLE: { icon: 'play_circle', label: 'Disponível' },
  LOCKED: { icon: 'lock', label: 'Bloqueado' },
}

export function NetworkTrailPage() {
  const { user, setUser, loading: userLoading } = useUserProfile()
  const [trail, setTrail] = useState<NetworkTrailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setTrail(await getNetworkTrail())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a trilha.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (userLoading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background font-mono text-primary"
        role="status"
        aria-live="polite"
      >
        Carregando Trilha de Redes...
      </div>
    )
  }

  const topics = trail?.topics ?? []

  return (
    <div className="flex min-h-screen w-full bg-background text-on-surface">
      <NetworkSidebar
        user={user}
        active="trail"
        onProfile={() => setIsProfileModalOpen(true)}
        onLogout={() => void apiLogout()}
      />

      <main className="ml-64 min-h-screen flex-1 px-6 py-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
              Laboratórios guiados
            </p>
            <h1 className="mt-2 text-3xl font-black italic tracking-tight">Trilha de Redes</h1>
            <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
              Configure os cenários apenas pelo terminal. Cada lab é corrigido pelo estado final da
              rede.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-4 py-1.5 shadow-inner">
              <span
                className="material-symbols-outlined text-orange-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <span className="text-sm font-black">{user.userStreak}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-4 py-1.5 shadow-inner">
              <span
                className="material-symbols-outlined text-yellow-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
              <span className="text-sm font-black">{Math.floor(user.userPoints)}</span>
            </div>
          </div>
        </header>

        {loading && (
          <div className="animate-pulse rounded-2xl border border-outline-variant bg-surface-container-low p-8 text-sm text-on-surface-variant">
            Carregando laboratórios...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-error/40 bg-error/5 p-6">
            <p className="text-sm text-error">{error}</p>
            <button type="button" onClick={() => void load()} className="btn-secondary mt-4">
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && topics.length === 0 && (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-8 text-sm text-on-surface-variant">
            Nenhum laboratório disponível ainda.
          </div>
        )}

        <div className="space-y-8">
          {topics.map((topic) => {
            const meta = TOPIC_META[topic.topic] ?? {
              label: topic.topic.replaceAll('_', ' '),
              icon: 'lan',
              description: '',
            }
            const percent =
              topic.totalQuestions > 0
                ? Math.round((topic.completedQuestions / topic.totalQuestions) * 100)
                : 0

            return (
              <section
                key={topic.topic}
                className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low"
              >
                <div className="border-b border-outline-variant bg-surface-container px-6 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <span className="material-symbols-outlined">{meta.icon}</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">
                          {meta.label}
                        </h2>
                        {meta.description && (
                          <p className="text-xs text-on-surface-variant">{meta.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="w-full max-w-xs">
                      <div className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-on-surface-variant">Progresso</span>
                        <span className="text-primary">
                          {topic.completedQuestions}/{topic.totalQuestions} · {percent}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full border border-outline-variant bg-background">
                        <div
                          className="h-full bg-primary transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <ol className="space-y-3 p-5">
                  {topic.questions.map((question, index) => (
                    <li key={question.questionId} className="relative flex gap-4">
                      <div className="flex flex-col items-center">
                        <StatusDot status={question.status} index={index + 1} />
                        {index < topic.questions.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-outline-variant" />
                        )}
                      </div>
                      <QuestionCard question={question} />
                    </li>
                  ))}
                </ol>
              </section>
            )
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-5 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-primary">check_circle</span>
            Concluído
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-primary">play_circle</span>
            Disponível
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">lock</span>
            Bloqueado
          </span>
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

function StatusDot({ status, index }: { status: LabStatus; index: number }) {
  const styles: Record<LabStatus, string> = {
    COMPLETED: 'border-primary bg-primary text-on-primary',
    AVAILABLE: 'border-primary bg-primary/15 text-primary animate-pulse',
    LOCKED: 'border-outline-variant bg-surface-container text-outline',
  }

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black ${styles[status]}`}
      title={STATUS_META[status].label}
    >
      <span className="material-symbols-outlined text-[18px]">
        {status === 'COMPLETED' ? 'check' : STATUS_META[status].icon}
      </span>
      <span className="sr-only">Lab {index}</span>
    </div>
  )
}

function QuestionCard({ question }: { question: NetworkTrailItem }) {
  const locked = question.status === 'LOCKED'
  const difficulty = DIFFICULTY_META[question.difficulty] ?? {
    label: question.difficulty,
    className: 'border-outline-variant bg-surface-container text-on-surface-variant',
  }
  const action =
    question.status === 'COMPLETED'
      ? 'Revisar'
      : question.status === 'AVAILABLE'
        ? 'Começar'
        : 'Bloqueado'

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-bold text-on-surface">{question.title}</h3>
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${difficulty.className}`}
          >
            {difficulty.label}
          </span>
          <span className="rounded-full border border-outline-variant px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
            Lab prático
          </span>
        </div>
        <p className="mt-1 text-xs text-on-surface-variant">
          {locked
            ? 'Conclua o lab anterior para liberar este desafio.'
            : 'Abra o terminal, configure a topologia e envie para correção.'}
        </p>
      </div>
      <span
        className={`ml-auto hidden shrink-0 items-center gap-1 text-[10px] font-black uppercase tracking-widest sm:flex ${
          locked ? 'text-outline' : 'text-primary'
        }`}
      >
        {action}
        {!locked && <span className="material-symbols-outlined text-[16px]">arrow_forward</span>}
      </span>
    </>
  )

  if (locked) {
    return (
      <div
        aria-disabled="true"
        className="flex flex-1 cursor-not-allowed items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest/60 px-4 py-3 opacity-60"
      >
        {content}
      </div>
    )
  }

  return (
    <a
      href={`/rede/${question.questionId}`}
      className="flex flex-1 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container px-4 py-3 transition-all hover:border-primary/60 hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {content}
    </a>
  )
}
