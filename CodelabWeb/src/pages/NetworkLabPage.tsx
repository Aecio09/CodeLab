import { useEffect, useState } from 'react'
import { apiLogout } from '../lib/api'
import { getNetworkTrail } from '../lib/networkLabApi'
import { useNetworkLab } from '../hooks/useNetworkLab'
import { useUserProfile } from '../hooks/useUserProfile'
import { AppSidebar } from '../components/AppSidebar'
import { AuthBackground } from '../components/AuthBackground'
import { ReadOnlyTopology } from '../components/network/ReadOnlyTopology'
import { LabTerminal } from '../components/network/LabTerminal'
import { ResultPanel } from '../components/network/ResultPanel'
import { EditProfileModal } from '../components/EditProfileModal'
import { PlaygroundLoading } from '../components/PlaygroundShell'
import {
  playgroundPrimaryButtonClass,
  playgroundSecondaryButtonClass,
} from '../lib/playground'

const DIFFICULTY_META: Record<string, { label: string; className: string }> = {
  EASY: {
    label: 'Fácil',
    className: 'border-cyan-400/20 bg-cyan-400/[0.06] text-trail-cyan',
  },
  MEDIUM: {
    label: 'Médio',
    className: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300',
  },
  HARD: {
    label: 'Difícil',
    className: 'border-red-500/20 bg-red-500/[0.06] text-red-300',
  },
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function NetworkLabPage({ questionId }: { questionId: number }) {
  const { user, setUser, loading: userLoading } = useUserProfile()
  const lab = useNetworkLab(questionId)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [nextQuestionId, setNextQuestionId] = useState<number | null>(null)

  const finish = () => {
    window.location.href = '/trilha/redes'
  }

  const approved = lab.result?.result.verdict === 'APPROVED'

  useEffect(() => {
    if (lab.phase !== 'result' || !approved) return
    let cancelled = false

    getNetworkTrail()
      .then((trail) => {
        if (cancelled) return
        const next = trail.topics
          .flatMap((topic) => topic.questions)
          .find((item) => item.status === 'AVAILABLE' && item.questionId !== questionId)
        setNextQuestionId(next?.questionId ?? null)
      })
      .catch(() => {
        if (!cancelled) setNextQuestionId(null)
      })

    return () => {
      cancelled = true
    }
  }, [lab.phase, approved, questionId])

  useEffect(() => {
    if (!lab.sessionId || lab.result) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [lab.sessionId, lab.result])

  const goNext = () => {
    window.location.href = nextQuestionId ? `/rede/${nextQuestionId}` : '/trilha/redes'
  }

  if (userLoading || !user) {
    return <PlaygroundLoading label="Carregando laboratório..." />
  }

  const difficulty = lab.question
    ? DIFFICULTY_META[lab.question.difficulty] ?? {
        label: lab.question.difficulty,
        className: 'border-trail-line bg-white/[0.04] text-trail-muted',
      }
    : null

  const submitLabel = lab.phase === 'submitting' ? 'Verificando...' : 'Verificar resposta'

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-trail-background font-sans text-[#e5e1e4] antialiased selection:bg-white selection:text-black">
      <AuthBackground />

      <AppSidebar
        items={[
          { key: 'trilha', label: 'Minha Trilha', icon: 'map', href: '/trilha' },
          { key: 'playground', label: 'Playground', icon: 'terminal', href: '/playground' },
          {
            key: 'net-playground',
            label: 'Playground de Redes',
            icon: 'lan',
            href: '/networkplayground',
          },
          {
            key: 'perfil',
            label: 'Meu Perfil',
            icon: 'account_circle',
            onClick: () => setIsProfileModalOpen(true),
          },
          { key: 'redes', label: 'Trilha de Redes', icon: 'route', href: '/trilha/redes' },
        ]}
        activeKey="redes"
        onLogout={() => {
          void apiLogout()
        }}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="relative ml-0 flex h-screen min-w-0 flex-1 flex-col transition-[margin-left] duration-200 md:ml-[var(--sidebar-w)]">
        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b-[0.5px] border-trail-line bg-trail-background/60 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-[0.5px] border-trail-line bg-white/[0.04] text-neutral-400 transition-colors hover:border-trail-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileNavOpen}
              aria-controls="app-sidebar"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                menu
              </span>
            </button>

            <a
              href="/trilha/redes"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-[0.5px] border-trail-line bg-white/[0.04] text-neutral-400 transition-colors hover:border-trail-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Voltar para a trilha de redes"
              title="Voltar para a trilha de redes"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                arrow_back
              </span>
            </a>

            <div className="min-w-0">
              <p className="hidden truncate font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 sm:block">
                Lab de Redes
              </p>
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate font-serif text-base text-white sm:text-lg">
                  {lab.question?.title ?? 'Carregando...'}
                </h1>
                {difficulty ? (
                  <span
                    className={`hidden shrink-0 rounded border-[0.5px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider sm:inline-flex ${difficulty.className}`}
                  >
                    {difficulty.label}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-1.5 text-trail-muted sm:flex" title="Tempo de sessão">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                schedule
              </span>
              <span className="font-mono text-xs tabular-nums">{formatElapsed(lab.elapsed)}</span>
            </div>

            <button
              type="button"
              onClick={() => void lab.submit()}
              disabled={lab.phase !== 'ready' || !lab.sessionId || lab.sessionExpired || lab.sending}
              className={`${playgroundPrimaryButtonClass} !h-9`}
              aria-label={submitLabel}
              title={submitLabel}
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  lab.phase === 'submitting' ? 'animate-spin' : ''
                }`}
                aria-hidden="true"
              >
                {lab.phase === 'submitting' ? 'progress_activity' : 'task_alt'}
              </span>
              <span className="hidden sm:inline">{submitLabel}</span>
            </button>
          </div>
        </header>

        {lab.phase === 'loading' && (
          <div className="relative z-10 flex flex-1 items-center justify-center p-6">
            <div
              className="flex items-center gap-2 font-mono text-sm text-trail-muted"
              role="status"
              aria-live="polite"
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-trail-cyan shadow-[0_0_8px_rgba(56,189,248,0.8)] motion-safe:animate-pulse"
                aria-hidden="true"
              />
              Preparando o laboratório...
            </div>
          </div>
        )}

        {lab.phase === 'locked' && (
          <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6">
            <div className="w-full max-w-md rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
              <span className="material-symbols-outlined text-[52px] text-trail-muted" aria-hidden="true">
                lock
              </span>
              <h2 className="mt-3 font-serif text-2xl text-white">Lab bloqueado</h2>
              <p className="mt-2 text-sm leading-relaxed text-trail-muted">
                Conclua o laboratório anterior para liberar
                {lab.question ? ` “${lab.question.title}”` : ' este desafio'}.
              </p>
              <button
                type="button"
                onClick={finish}
                className={`${playgroundPrimaryButtonClass} mt-6`}
              >
                Voltar à trilha
              </button>
            </div>
          </div>
        )}

        {lab.phase === 'error' && (
          <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6">
            <div className="w-full max-w-md rounded-lg border-[0.5px] border-red-500/20 bg-trail-surface/95 p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
              <span className="material-symbols-outlined text-[52px] text-red-300" aria-hidden="true">
                error
              </span>
              <h2 className="mt-3 font-serif text-2xl text-white">Não foi possível abrir o lab</h2>
              <p className="mt-2 text-sm leading-relaxed text-trail-muted">{lab.error}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={finish} className={playgroundSecondaryButtonClass}>
                  Voltar à trilha
                </button>
                <button
                  type="button"
                  onClick={() => void lab.start()}
                  className={playgroundPrimaryButtonClass}
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {(lab.phase === 'ready' ||
          lab.phase === 'submitting' ||
          lab.phase === 'result') && (
          <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
            {lab.error && lab.phase === 'ready' && (
              <div className="shrink-0 rounded-lg border-[0.5px] border-red-500/20 bg-red-500/[0.06] px-4 py-2 font-mono text-xs text-red-300">
                {lab.error}
              </div>
            )}

            <section className="flex h-[280px] shrink-0 flex-col overflow-hidden rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b-[0.5px] border-trail-line bg-trail-background/40 px-4 py-2.5">
                <span className="material-symbols-outlined text-[16px] text-trail-muted" aria-hidden="true">
                  hub
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">
                  Topologia
                </span>
                <span className="ml-auto font-mono text-[10px] text-trail-muted">
                  Somente leitura · clique em um dispositivo
                </span>
              </div>
              <div className="min-h-0 flex-1 p-3">
                <ReadOnlyTopology
                  devices={lab.devices}
                  links={lab.links}
                  selectedRef={lab.selectedRef}
                  onSelect={lab.setSelectedRef}
                />
              </div>
            </section>

            <LabTerminal
              devices={lab.devices}
              selectedRef={lab.selectedRef}
              onSelect={lab.setSelectedRef}
              lines={lab.lines}
              prompt={lab.prompt}
              input={lab.input}
              onInput={lab.setInput}
              onSend={(line) => void lab.send(line)}
              disabled={lab.phase !== 'ready' || lab.sessionExpired}
            />
          </div>
        )}
      </main>

      {lab.result && (
        <ResultPanel
          result={lab.result}
          hasNext={nextQuestionId !== null}
          onRestart={() => void lab.restart()}
          onNext={goNext}
          onBack={finish}
        />
      )}

      {lab.sessionExpired && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-trail-background/85 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
        >
          <div className="w-full max-w-sm rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <span className="material-symbols-outlined text-[48px] text-red-300" aria-hidden="true">
              timer_off
            </span>
            <h2 id="session-expired-title" className="mt-2 font-serif text-2xl text-white">
              Sessão expirada
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-trail-muted">
              O laboratório ficou inativo por muito tempo. Recomece para continuar.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={finish} className={playgroundSecondaryButtonClass}>
                Voltar à trilha
              </button>
              <button
                type="button"
                onClick={() => void lab.restart()}
                className={playgroundPrimaryButtonClass}
              >
                Recomeçar
              </button>
            </div>
          </div>
        </div>
      )}

      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdate={(updated) => setUser(updated)}
      />
    </div>
  )
}
