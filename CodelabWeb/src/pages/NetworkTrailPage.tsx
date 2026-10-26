import { useEffect, useRef, useState } from 'react'
import { apiLogout } from '../lib/api'
import { getNetworkTrail } from '../lib/networkLabApi'
import { useUserProfile } from '../hooks/useUserProfile'
import { AppSidebar } from '../components/AppSidebar'
import { AuthBackground } from '../components/AuthBackground'
import { EditProfileModal } from '../components/EditProfileModal'
import { LessonConstellation } from '../components/trail/LessonConstellation'
import type { LessonNode } from '../components/trail/LessonConstellation'
import { resolvePhotoUrl } from '../utils'
import type {
  LabStatus,
  NetworkTrailResponse,
  NetworkTrailTopic,
} from '../types/network'

const TOPIC_META: Record<string, { label: string; icon: string; description: string }> = {
  BASIC_NETWORKING: {
    label: 'Redes Básicas',
    icon: 'lan',
    description: 'Endereçamento IP, switches, VLANs e roteamento.',
  },
}

const DIFFICULTY_META: Record<string, { label: string; className: string }> = {
  EASY: {
    label: 'Fácil',
    className: 'border-trail-line bg-white/[0.04] text-neutral-300',
  },
  MEDIUM: {
    label: 'Médio',
    className: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  },
  HARD: {
    label: 'Difícil',
    className: 'border-red-500/20 bg-red-500/10 text-red-300',
  },
}

const CARD_STATUS_LABEL: Record<LabStatus, string> = {
  COMPLETED: 'Lab concluído',
  AVAILABLE: 'Lab atual',
  LOCKED: 'Lab bloqueado',
}

function getDefaultLabNumber(topic: NetworkTrailTopic): number {
  if (topic.questions.length === 0) return 0

  const availableIndex = topic.questions.findIndex((question) => question.status === 'AVAILABLE')
  if (availableIndex >= 0) return availableIndex + 1

  for (let index = topic.questions.length - 1; index >= 0; index -= 1) {
    if (topic.questions[index].status === 'COMPLETED') return index + 1
  }

  return 1
}

export function NetworkTrailPage() {
  const { user, setUser, loading: userLoading } = useUserProfile()
  const [trail, setTrail] = useState<NetworkTrailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [activeTopicIndex, setActiveTopicIndex] = useState(0)
  const [selectedLabNumber, setSelectedLabNumber] = useState(1)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const contentRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    const fetchTrail = async () => {
      try {
        const data = await getNetworkTrail()
        if (cancelled) return

        setTrail(data)
        const firstAvailable = data.topics.findIndex((topic) => topic.status === 'AVAILABLE')
        const initialTopicIndex = firstAvailable >= 0 ? firstAvailable : Math.max(data.topics.length - 1, 0)
        setActiveTopicIndex(initialTopicIndex)

        const initialTopic = data.topics[initialTopicIndex]
        setSelectedLabNumber(initialTopic ? getDefaultLabNumber(initialTopic) : 0)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar a trilha.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchTrail()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  if (userLoading || !user) {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-trail-background font-mono text-sm text-trail-muted">
        <AuthBackground />
        <div className="relative z-10" role="status" aria-live="polite">
          Carregando trilha de redes...
        </div>
      </div>
    )
  }

  const topics = trail?.topics ?? []
  const activeTopic = topics[activeTopicIndex] ?? topics[0]
  const currentTopicIndex = activeTopic ? Math.max(topics.indexOf(activeTopic), 0) : 0
  const meta = activeTopic
    ? (TOPIC_META[activeTopic.topic] ?? {
        label: activeTopic.topic.replaceAll('_', ' '),
        icon: 'lan',
        description: '',
      })
    : null

  const labNodes: LessonNode[] =
    activeTopic?.questions.map((question, index) => ({
      number: index + 1,
      state: question.status,
    })) ?? []

  const totalLabs = labNodes.length
  const completedLabs = labNodes.filter((lab) => lab.state === 'COMPLETED').length
  const labProgress = Math.round((completedLabs / Math.max(totalLabs, 1)) * 100)
  const selectedLabIndex =
    totalLabs > 0 ? Math.min(Math.max(selectedLabNumber - 1, 0), totalLabs - 1) : -1
  const selectedLab = activeTopic && selectedLabIndex >= 0 ? activeTopic.questions[selectedLabIndex] : null
  const selectedLabDisplayNumber = selectedLabIndex + 1
  const selectedLabDifficulty = selectedLab
    ? (DIFFICULTY_META[selectedLab.difficulty] ?? {
        label: selectedLab.difficulty,
        className: 'border-trail-line bg-white/[0.04] text-neutral-400',
      })
    : { label: '', className: '' }
  const labLocked = selectedLab?.status === 'LOCKED'
  const labComplete = selectedLab?.status === 'COMPLETED'

  const ctaLabel = !selectedLab
    ? 'Abrir lab'
    : labLocked
      ? 'Lab bloqueado'
      : labComplete
        ? 'Revisar lab'
        : activeTopic?.completedQuestions === 0
          ? 'Iniciar lab'
          : 'Continuar lab'

  const cardDescription = !selectedLab
    ? ''
    : labLocked
      ? 'Conclua o lab anterior para desbloquear este desafio.'
      : labComplete
        ? 'Você concluiu este lab. Revisite a topologia e revise sua configuração.'
        : 'Abra o terminal, configure a topologia e envie para correção.'

  const sidebarItems = [
    { key: 'trilha', label: 'Minha Trilha', icon: 'map', href: '/trilha' },
    { key: 'playground', label: 'Playground', icon: 'terminal', href: '/playground' },
    {
      key: 'perfil',
      label: 'Meu Perfil',
      icon: 'account_circle',
      onClick: () => setIsProfileModalOpen(true),
    },
    { key: 'redes', label: 'Trilha de Redes', icon: 'lan', href: '/trilha/redes' },
  ]

  const animationClass = direction === 'next' ? 'trail-enter-next' : 'trail-enter-prev'

  const goToTopic = (nextIndex: number) => {
    if (!activeTopic || nextIndex < 0 || nextIndex >= topics.length || nextIndex === currentTopicIndex) {
      return
    }

    setDirection(nextIndex > currentTopicIndex ? 'next' : 'prev')
    setActiveTopicIndex(nextIndex)

    const nextTopic = topics[nextIndex]
    if (nextTopic) setSelectedLabNumber(getDefaultLabNumber(nextTopic))

    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }

  const selectLab = (number: number) => {
    setSelectedLabNumber(number)
    window.requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const retry = () => {
    setLoading(true)
    setError(null)
    setReloadKey((value) => value + 1)
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-trail-background font-sans text-[#e5e1e4] antialiased selection:bg-white selection:text-black">
      <AuthBackground />

      <AppSidebar
        items={sidebarItems}
        activeKey="redes"
        onLogout={() => void apiLogout()}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="relative ml-0 flex h-screen min-w-0 flex-1 flex-col transition-[margin-left] duration-200 md:ml-[var(--sidebar-w)]">
        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b-[0.5px] border-trail-line bg-trail-background/60 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded border-[0.5px] border-trail-line bg-white/[0.04] text-neutral-400 transition-colors hover:border-trail-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileNavOpen}
              aria-controls="app-sidebar"
            >
              <span className="material-symbols-outlined" aria-hidden="true">menu</span>
            </button>
            <div className="hidden min-w-0 sm:block">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                Trilha de redes
              </p>
              <p className="truncate font-serif text-lg text-white">Laboratórios</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div
              className="flex items-center gap-1.5 rounded border-[0.5px] border-trail-line bg-white/[0.04] px-2.5 py-1.5 sm:gap-2 sm:px-3"
              title={`${user.userStreak} dias de sequência`}
            >
              <span
                className="material-symbols-outlined text-[16px] text-amber-400"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                local_fire_department
              </span>
              <span className="font-mono text-xs font-bold text-white">{user.userStreak}</span>
              <span className="sr-only font-mono text-[10px] uppercase tracking-wider text-trail-muted sm:not-sr-only">
                dias
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 rounded border-[0.5px] border-trail-line bg-white/[0.04] px-2.5 py-1.5 sm:gap-2 sm:px-3"
              title={`${Math.floor(user.userPoints)} pontos acumulados`}
            >
              <span
                className="material-symbols-outlined text-[16px] text-trail-cyan"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                stars
              </span>
              <span className="font-mono text-xs font-bold text-white">
                {Math.floor(user.userPoints).toLocaleString('pt-BR')}
              </span>
              <span className="sr-only font-mono text-[10px] uppercase tracking-wider text-trail-muted sm:not-sr-only">
                pontos
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 rounded border-0 pl-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:border-l-[0.5px] sm:border-trail-line sm:pl-3"
              aria-label="Abrir meu perfil"
            >
              <div className="hidden text-right sm:block">
                <div className="max-w-[120px] truncate text-xs font-medium text-white">{user.name}</div>
                <div className="font-mono text-[10px] text-trail-muted">Estudante</div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded border-[0.5px] border-trail-line bg-white/[0.04]">
                {avatarFailed ? (
                  <span className="material-symbols-outlined text-lg text-trail-muted" aria-hidden="true">
                    person
                  </span>
                ) : (
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={resolvePhotoUrl(user.photo, user.name)}
                    onError={() => setAvatarFailed(true)}
                  />
                )}
              </div>
            </button>
          </div>
        </header>

        <div ref={contentRef} className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-[1500px] flex-col justify-center px-14 pb-24 pt-6 sm:px-16 sm:pb-16 md:px-20 md:pb-10 lg:px-24">
            {loading ? (
              <div
                className="mx-auto w-full max-w-[440px] rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
                role="status"
                aria-live="polite"
              >
                <div className="animate-pulse space-y-3">
                  <div className="h-3 w-40 rounded bg-white/[0.06]" />
                  <div className="h-2 w-full rounded bg-white/[0.04]" />
                  <div className="h-2 w-2/3 rounded bg-white/[0.04]" />
                </div>
                <span className="sr-only">Carregando laboratórios...</span>
              </div>
            ) : error ? (
              <div
                className="mx-auto w-full max-w-[520px] rounded-lg border-[0.5px] border-red-500/20 bg-red-500/[0.06] p-5"
                role="alert"
              >
                <p className="text-sm text-red-300">{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded border-[0.5px] border-trail-line bg-white/[0.04] px-3 font-mono text-[10px] uppercase tracking-wider text-neutral-300 transition-colors hover:border-trail-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Tentar novamente
                </button>
              </div>
            ) : !activeTopic || !meta ? (
              <div className="mx-auto w-full max-w-[440px] rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
                <p className="text-sm font-light text-neutral-400">
                  Nenhum laboratório disponível no momento. Tente novamente mais tarde.
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 rounded bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-neutral-950 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trail-background"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <p className="sr-only" aria-live="polite">
                  Módulo {currentTopicIndex + 1} de {topics.length}: {meta.label}. {completedLabs} de{' '}
                  {totalLabs} labs concluídos.
                  {selectedLab
                    ? ` Lab ${selectedLabDisplayNumber} de ${totalLabs}: ${selectedLab.title}. ${CARD_STATUS_LABEL[selectedLab.status]}.`
                    : ''}
                </p>

                <div key={activeTopic.topic} className={animationClass}>
                  <div className="mx-auto max-w-3xl space-y-3 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border-[0.5px] border-trail-line bg-white/[0.04] px-3 py-1 font-mono text-xs text-neutral-300">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-trail-cyan shadow-[0_0_8px_rgba(56,189,248,0.8)] motion-safe:animate-pulse"
                        aria-hidden="true"
                      />
                      Módulo {String(currentTopicIndex + 1).padStart(2, '0')} de{' '}
                      {String(topics.length).padStart(2, '0')}
                    </div>

                    <h1 className="font-serif text-3xl leading-tight text-white md:text-5xl">
                      {meta.label}
                    </h1>

                    <p className="mx-auto max-w-xl text-sm font-light text-neutral-400">
                      {meta.description ||
                        'Configure os cenários apenas pelo terminal. Cada lab é corrigido pelo estado final da rede.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs text-neutral-400">
                      <div className="h-1 w-48 overflow-hidden rounded-full bg-trail-line">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 shadow-[0_0_12px_rgba(56,189,248,0.45)] transition-[width] duration-500"
                          style={{ width: `${labProgress}%` }}
                        />
                      </div>
                      <span>
                        {completedLabs} de {totalLabs} labs concluídos ({labProgress}%)
                      </span>
                    </div>
                  </div>

                  {totalLabs === 0 ? (
                    <div className="mx-auto mt-6 w-full max-w-[440px] rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 p-6 text-center shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
                      <p className="text-sm font-light text-neutral-400">
                        Nenhum laboratório disponível neste módulo.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 sm:mt-6">
                        <LessonConstellation
                          lessons={labNodes}
                          icon={meta.icon}
                          itemLabel="Lab"
                          ariaLabel="Laboratórios do módulo"
                          stateLabels={{
                            COMPLETED: 'Concluído',
                            AVAILABLE: 'Disponível',
                            LOCKED: 'Bloqueado',
                          }}
                          selectedNumber={selectedLabDisplayNumber}
                          onSelect={selectLab}
                        />
                      </div>

                      {selectedLab && (
                        <div
                          ref={cardRef}
                          className={`relative mx-auto mt-2 w-full max-w-[440px] overflow-hidden rounded-lg border-[0.5px] bg-trail-surface/95 p-5 backdrop-blur-md ${
                            labLocked || labComplete
                              ? 'border-trail-line shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
                              : 'border-cyan-400/15 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.12)]'
                          }`}
                        >
                          <div
                            className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${
                              labLocked
                                ? 'from-trail-accent via-trail-line to-transparent'
                                : 'from-violet-500 via-cyan-400 to-sky-300 opacity-60'
                            }`}
                            aria-hidden="true"
                          />

                          <div className="flex items-center justify-between gap-3 border-b-[0.5px] border-trail-line pb-2.5 font-mono text-[10px]">
                            <span
                              className={
                                labLocked
                                  ? 'text-neutral-500'
                                  : labComplete
                                    ? 'text-white'
                                    : 'text-trail-cyan'
                              }
                            >
                              {CARD_STATUS_LABEL[selectedLab.status]}
                            </span>
                            <span className="text-neutral-400">
                              Lab {selectedLabDisplayNumber} de {totalLabs}
                            </span>
                          </div>

                          <div className="mt-3 flex items-start gap-3">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border-[0.5px] ${
                                labLocked
                                  ? 'border-trail-line bg-trail-background text-neutral-500'
                                  : labComplete
                                    ? 'border-trail-line bg-white/[0.05] text-white'
                                    : 'border-cyan-400/15 bg-cyan-400/10 text-cyan-300 shadow-[0_0_18px_rgba(56,189,248,0.18)]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                                {labLocked ? 'lock' : meta.icon}
                              </span>
                            </span>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-serif text-xl leading-snug text-white">
                                  {selectedLab.title}
                                </h2>
                                <span
                                  className={`rounded-full border-[0.5px] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${selectedLabDifficulty.className}`}
                                >
                                  {selectedLabDifficulty.label}
                                </span>
                                <span className="rounded-full border-[0.5px] border-trail-line bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                                  Lab prático
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-light leading-relaxed text-neutral-400">
                                {cardDescription}
                              </p>
                            </div>
                          </div>

                          {labLocked ? (
                            <button
                              type="button"
                              disabled
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-neutral-950 shadow-[0_0_22px_rgba(255,255,255,0.18)] transition-all disabled:pointer-events-none disabled:opacity-40"
                            >
                              {ctaLabel}
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                                lock
                              </span>
                            </button>
                          ) : (
                            <a
                              href={`/rede/${selectedLab.questionId}`}
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-neutral-950 shadow-[0_0_22px_rgba(255,255,255,0.18)] transition-all hover:bg-neutral-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trail-surface"
                            >
                              {ctaLabel}
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                                arrow_forward
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {!loading && !error && activeTopic && (
          <>
            <button
              type="button"
              onClick={() => goToTopic(currentTopicIndex - 1)}
              disabled={currentTopicIndex === 0}
              className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-[0.5px] border-trail-line bg-trail-surface/70 text-neutral-400 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-cyan-400/25 hover:bg-trail-surface hover:text-white hover:shadow-[0_0_24px_rgba(56,189,248,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-25 md:left-4 md:h-12 md:w-12 lg:left-6"
              aria-label="Ir para o módulo anterior"
              title="Módulo anterior"
            >
              <span className="material-symbols-outlined text-[22px] md:text-[24px]" aria-hidden="true">
                chevron_left
              </span>
            </button>

            <button
              type="button"
              onClick={() => goToTopic(currentTopicIndex + 1)}
              disabled={currentTopicIndex === topics.length - 1}
              className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-[0.5px] border-trail-line bg-trail-surface/70 text-neutral-400 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-cyan-400/25 hover:bg-trail-surface hover:text-white hover:shadow-[0_0_24px_rgba(56,189,248,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-25 md:right-4 md:h-12 md:w-12 lg:right-6"
              aria-label="Ir para o próximo módulo"
              title="Próximo módulo"
            >
              <span className="material-symbols-outlined text-[22px] md:text-[24px]" aria-hidden="true">
                chevron_right
              </span>
            </button>
          </>
        )}
      </main>

      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdate={(updated) => {
          setUser(updated)
          setAvatarFailed(false)
        }}
      />
    </div>
  )
}
