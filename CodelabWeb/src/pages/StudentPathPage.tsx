import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../constants'
import { authFetch, apiLogout } from '../lib/api'
import type { TopicStatus, UserProfile } from '../types'
import { EditProfileModal } from '../components/EditProfileModal'
import { AuthBackground } from '../components/AuthBackground'
import { AppSidebar } from '../components/AppSidebar'
import { LessonConstellation } from '../components/trail/LessonConstellation'
import type { LessonNode, LessonState } from '../components/trail/LessonConstellation'
import { resolvePhotoUrl } from '../utils'

const TOPIC_METADATA: Record<string, { label: string; icon: string; description: string }> = {
  OPERADORES_TIPOS_E_VARIAVEIS: {
    label: 'Variáveis e Tipos',
    icon: 'variables',
    description: 'Armazene e manipule os primeiros valores do seu programa.',
  },
  EXECUCAO_CONDICIONAL: {
    label: 'Condicionais',
    icon: 'data_object',
    description: 'Faça seu código tomar decisões e seguir caminhos diferentes.',
  },
  OPERADORES_LOGICOS: {
    label: 'Lógica',
    icon: 'rule',
    description: 'Combine condições e construa raciocínios mais precisos.',
  },
  LACOS: {
    label: 'Laços de Repetição',
    icon: 'alt_route',
    description: 'Repita instruções e automatize tarefas dentro do programa.',
  },
  SUBPROGRAMAS: {
    label: 'Funções',
    icon: 'functions',
    description: 'Organize soluções em blocos reutilizáveis e bem definidos.',
  },
  VETORES: {
    label: 'Vetores',
    icon: 'reorder',
    description: 'Trabalhe com sequências de valores de forma indexada.',
  },
  ARRAYS: {
    label: 'Arrays',
    icon: 'view_module',
    description: 'Manipule coleções, percorra listas e organize dados.',
  },
  TIPOS_CRIADOS_PELO_PROGRAMADOR: {
    label: 'Estruturas',
    icon: 'account_tree',
    description: 'Modele dados com estruturas próprias e mais expressivas.',
  },
}

type ModuleDirection = 'next' | 'prev'

function getLessonState(unit: TopicStatus, lessonNumber: number): LessonState {
  if (unit.status === 'COMPLETED') return 'COMPLETED'
  if (unit.status === 'LOCKED') return 'LOCKED'
  if (lessonNumber < unit.currentLesson) return 'COMPLETED'
  if (lessonNumber === unit.currentLesson) return 'AVAILABLE'
  return 'LOCKED'
}

function getLessonNodes(unit: TopicStatus): LessonNode[] {
  return Array.from({ length: unit.totalLessons }, (_, index) => ({
    number: index + 1,
    state: getLessonState(unit, index + 1),
  }))
}

export function StudentPathPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<TopicStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [direction, setDirection] = useState<ModuleDirection>('next')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        const userRes = await authFetch(`${API_BASE_URL}/api/users/me`)
        if (!userRes.ok) throw new Error('Não autenticado')

        const userData = (await userRes.json()) as UserProfile
        if (cancelled) return

        setUser(userData)
        setAvatarFailed(false)

        const progressRes = await authFetch(`${API_BASE_URL}/api/trail/progress`)
        if (progressRes.ok) {
          const progressData = (await progressRes.json()) as TopicStatus[]
          if (cancelled) return

          setProgress(progressData)
          const firstAvailable = progressData.findIndex((unit) => unit.status === 'AVAILABLE')
          setActiveModuleIndex(firstAvailable >= 0 ? firstAvailable : Math.max(progressData.length - 1, 0))
        }
      } catch (err) {
        console.error(err)
        window.location.href = '/'
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = () => {
    apiLogout()
  }

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

  const goToModule = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= progress.length || nextIndex === activeModuleIndex) return
    setDirection(nextIndex > activeModuleIndex ? 'next' : 'prev')
    setActiveModuleIndex(nextIndex)
    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }

  if (loading || !user) {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-trail-background font-mono text-sm text-trail-muted">
        <AuthBackground />
        <div className="relative z-10" role="status" aria-live="polite">
          Carregando sua trilha...
        </div>
      </div>
    )
  }

  if (progress.length === 0) {
    return (
      <div className="relative flex h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-trail-background px-6 text-center">
        <AuthBackground />
        <p className="relative z-10 font-mono text-sm text-trail-muted">
          Nenhum módulo disponível no momento. Tente novamente mais tarde.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="relative z-10 rounded bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-neutral-950 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trail-background"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const activeUnit = progress[activeModuleIndex] ?? progress[0]
  const meta = TOPIC_METADATA[activeUnit.topicName] ?? {
    label: activeUnit.topicName,
    icon: 'help',
    description: 'Módulo da trilha de programação.',
  }

  const lessonNodes = getLessonNodes(activeUnit)
  const completedLessons = lessonNodes.filter((lesson) => lesson.state === 'COMPLETED').length
  const lessonProgress = Math.round((completedLessons / Math.max(activeUnit.totalLessons, 1)) * 100)
  const moduleLocked = activeUnit.status === 'LOCKED'
  const moduleComplete = activeUnit.status === 'COMPLETED'

  const ctaLabel = moduleLocked
    ? 'Módulo bloqueado'
    : moduleComplete
      ? 'Revisar módulo'
      : activeUnit.totalActivitiesCompleted === 0
        ? 'Iniciar lição'
        : 'Continuar lição'

  const cardTitle = moduleComplete || moduleLocked ? meta.label : `Lição ${activeUnit.currentLesson}`

  const cardDescription = moduleLocked
    ? 'Conclua o módulo anterior para desbloquear esta etapa.'
    : moduleComplete
      ? 'Você concluiu este módulo. Revisite os conceitos quando quiser.'
      : activeUnit.totalActivitiesCompleted === 0
        ? 'Comece a primeira lição deste módulo e avance no seu ritmo.'
        : 'Continue de onde parou. Complete as atividades para avançar.'

  const sidebarItems = [
    { key: 'trilha', label: 'Minha Trilha', icon: 'map', href: '/trilha' },
    { key: 'playground', label: 'Playground', icon: 'terminal', href: '/playground' },
    { key: 'perfil', label: 'Meu Perfil', icon: 'account_circle', onClick: () => setIsProfileModalOpen(true) },
    { key: 'redes', label: 'Trilha de Redes', icon: 'lan', href: '/trilha/redes' },
  ]

  const animationClass = direction === 'next' ? 'trail-enter-next' : 'trail-enter-prev'

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-trail-background font-sans text-[#e5e1e4] antialiased selection:bg-white selection:text-black">
      <AuthBackground />

      <AppSidebar
        items={sidebarItems}
        activeKey="trilha"
        onLogout={handleLogout}
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
                Trilha de programação
              </p>
              <p className="truncate font-serif text-lg text-white">Minha trilha</p>
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
            <p className="sr-only" aria-live="polite">
              Módulo {activeModuleIndex + 1} de {progress.length}: {meta.label}. {completedLessons} de{' '}
              {activeUnit.totalLessons} lições concluídas.
            </p>
            <div key={activeUnit.topicName} className={animationClass}>
              <div className="mx-auto max-w-3xl space-y-3 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border-[0.5px] border-trail-line bg-white/[0.04] px-3 py-1 font-mono text-xs text-neutral-300">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-trail-cyan shadow-[0_0_8px_rgba(56,189,248,0.8)] motion-safe:animate-pulse"
                    aria-hidden="true"
                  ></span>
                  Módulo {String(activeModuleIndex + 1).padStart(2, '0')} de{' '}
                  {String(progress.length).padStart(2, '0')}
                </div>

                <h1 className="font-serif text-3xl leading-tight text-white md:text-5xl">
                  {meta.label}
                </h1>

                <p className="mx-auto max-w-xl text-sm font-light text-neutral-400">
                  {meta.description}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs text-neutral-400">
                  <div className="h-1 w-48 overflow-hidden rounded-full bg-trail-line">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 shadow-[0_0_12px_rgba(56,189,248,0.45)] transition-[width] duration-500"
                      style={{ width: `${lessonProgress}%` }}
                    />
                  </div>
                  <span>
                    {completedLessons} de {activeUnit.totalLessons} lições concluídas ({lessonProgress}%)
                  </span>
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <LessonConstellation lessons={lessonNodes} icon={meta.icon} />
              </div>

              <div
                className={`relative mx-auto mt-2 w-full max-w-[440px] overflow-hidden rounded-lg border-[0.5px] bg-trail-surface/95 p-5 backdrop-blur-md ${
                  moduleLocked
                    ? 'border-trail-line shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
                    : moduleComplete
                      ? 'border-trail-line shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
                      : 'border-cyan-400/15 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.12)]'
                }`}
              >
                <div
                  className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${
                    moduleLocked
                      ? 'from-trail-accent via-trail-line to-transparent'
                      : 'from-violet-500 via-cyan-400 to-sky-300 opacity-60'
                  }`}
                  aria-hidden="true"
                />
                <div className="flex items-center justify-between gap-3 border-b-[0.5px] border-trail-line pb-2.5 font-mono text-[10px]">
                  <span
                    className={
                      moduleLocked
                        ? 'text-neutral-500'
                        : moduleComplete
                          ? 'text-white'
                          : 'text-trail-cyan'
                    }
                  >
                    {moduleLocked ? 'Módulo bloqueado' : moduleComplete ? 'Módulo concluído' : 'Lição atual'}
                  </span>
                  <span className="text-neutral-400">
                    {moduleComplete
                      ? `${activeUnit.totalLessons} lições`
                      : moduleLocked
                        ? 'Indisponível'
                        : `Lição ${activeUnit.currentLesson} de ${activeUnit.totalLessons}`}
                  </span>
                </div>

                <div className="mt-3 flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border-[0.5px] ${
                      moduleLocked
                        ? 'border-trail-line bg-trail-background text-neutral-500'
                        : moduleComplete
                          ? 'border-trail-line bg-white/[0.05] text-white'
                          : 'border-cyan-400/15 bg-cyan-400/10 text-cyan-300 shadow-[0_0_18px_rgba(56,189,248,0.18)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      {moduleLocked ? 'lock' : meta.icon}
                    </span>
                  </span>

                  <div className="min-w-0">
                    <h2 className="font-serif text-xl leading-snug text-white">{cardTitle}</h2>
                    <p className="mt-1 text-xs font-light leading-relaxed text-neutral-400">
                      {cardDescription}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleNavigateToPlayground(activeUnit.topicName)}
                  disabled={moduleLocked}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-neutral-950 shadow-[0_0_22px_rgba(255,255,255,0.18)] transition-all hover:bg-neutral-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trail-surface disabled:pointer-events-none disabled:opacity-40"
                >
                  {ctaLabel}
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    {moduleLocked ? 'lock' : 'arrow_forward'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => goToModule(activeModuleIndex - 1)}
          disabled={activeModuleIndex === 0}
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
          onClick={() => goToModule(activeModuleIndex + 1)}
          disabled={activeModuleIndex === progress.length - 1}
          className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-[0.5px] border-trail-line bg-trail-surface/70 text-neutral-400 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-cyan-400/25 hover:bg-trail-surface hover:text-white hover:shadow-[0_0_24px_rgba(56,189,248,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-25 md:right-4 md:h-12 md:w-12 lg:right-6"
          aria-label="Ir para o próximo módulo"
          title="Próximo módulo"
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]" aria-hidden="true">
            chevron_right
          </span>
        </button>
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
