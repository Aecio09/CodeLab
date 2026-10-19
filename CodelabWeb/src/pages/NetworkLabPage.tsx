import { useEffect, useState } from 'react'
import { apiLogout } from '../lib/api'
import { getNetworkTrail } from '../lib/networkLabApi'
import { useNetworkLab } from '../hooks/useNetworkLab'
import { useUserProfile } from '../hooks/useUserProfile'
import { NetworkSidebar } from '../components/network/NetworkSidebar'
import { ReadOnlyTopology } from '../components/network/ReadOnlyTopology'
import { LabTerminal } from '../components/network/LabTerminal'
import { ResultPanel } from '../components/network/ResultPanel'
import { EditProfileModal } from '../components/EditProfileModal'

const DIFFICULTY_META: Record<string, { label: string; className: string }> = {
  EASY: { label: 'Fácil', className: 'border-primary/40 bg-primary/10 text-primary' },
  MEDIUM: { label: 'Médio', className: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300' },
  HARD: { label: 'Difícil', className: 'border-error/40 bg-error/10 text-error' },
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
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background font-mono text-primary"
        role="status"
        aria-live="polite"
      >
        Carregando laboratório...
      </div>
    )
  }

  const difficulty = lab.question
    ? DIFFICULTY_META[lab.question.difficulty] ?? {
        label: lab.question.difficulty,
        className: 'border-outline-variant text-on-surface-variant',
      }
    : null

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-on-surface">
      <NetworkSidebar
        user={user}
        active="lab"
        onProfile={() => setIsProfileModalOpen(true)}
        onLogout={() => void apiLogout()}
      />

      <main className="ml-64 flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-outline-variant bg-background/80 px-6 backdrop-blur-md">
          <a
            href="/trilha/redes"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:border-primary/60 hover:text-primary"
            aria-label="Voltar para a trilha de redes"
            title="Voltar para a trilha de redes"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </a>

          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
              Lab de Redes
            </p>
            <h1 className="truncate text-sm font-black italic">
              {lab.question?.title ?? 'Carregando...'}
            </h1>
          </div>

          {difficulty && (
            <span
              className={`hidden rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider sm:inline ${difficulty.className}`}
            >
              {difficulty.label}
            </span>
          )}

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-3 py-1.5">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                timer
              </span>
              <span className="font-mono text-xs font-bold">
                {formatElapsed(lab.elapsed)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void lab.submit()}
              disabled={lab.phase !== 'ready' || !lab.sessionId || lab.sessionExpired || lab.sending}
              className="btn-primary !h-9 !px-4 !text-[10px]"
            >
              <span className="material-symbols-outlined text-[17px]">task_alt</span>
              {lab.phase === 'submitting' ? 'Verificando...' : 'Verificar resposta'}
            </button>
          </div>
        </header>

        {lab.phase === 'loading' && (
          <div className="flex flex-1 items-center justify-center font-mono text-sm text-primary animate-pulse">
            Preparando o laboratório...
          </div>
        )}

        {lab.phase === 'locked' && (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-low p-8 text-center">
              <span className="material-symbols-outlined text-[52px] text-outline">lock</span>
              <h2 className="mt-3 text-lg font-black">Lab bloqueado</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                Conclua o laboratório anterior para liberar
                {lab.question ? ` “${lab.question.title}”` : ' este desafio'}.
              </p>
              <button type="button" onClick={finish} className="btn-primary mt-6">
                Voltar à trilha
              </button>
            </div>
          </div>
        )}

        {lab.phase === 'error' && (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-error/40 bg-error/5 p-8 text-center">
              <span className="material-symbols-outlined text-[52px] text-error">error</span>
              <h2 className="mt-3 text-lg font-black">Não foi possível abrir o lab</h2>
              <p className="mt-2 text-sm text-on-surface-variant">{lab.error}</p>
              <div className="mt-6 flex justify-center gap-2">
                <button type="button" onClick={finish} className="btn-secondary">
                  Voltar à trilha
                </button>
                <button type="button" onClick={() => void lab.start()} className="btn-primary">
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {(lab.phase === 'ready' ||
          lab.phase === 'submitting' ||
          lab.phase === 'result') && (
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:p-5">
            {lab.error && lab.phase === 'ready' && (
              <div className="shrink-0 rounded-lg border border-error/40 bg-error/5 px-4 py-2 text-xs text-error">
                {lab.error}
              </div>
            )}

            <section className="flex h-[280px] shrink-0 flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
              <div className="flex shrink-0 items-center gap-2 border-b border-outline-variant px-4 py-2">
                <span className="material-symbols-outlined text-[18px] text-primary">hub</span>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Topologia
                </span>
                <span className="ml-auto text-[10px] text-on-surface-variant">
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
              disabled={
                lab.phase !== 'ready' || lab.sessionExpired
              }
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface-container p-6 text-center shadow-2xl">
            <span className="material-symbols-outlined text-[48px] text-error">timer_off</span>
            <h2 id="session-expired-title" className="mt-2 text-lg font-black">
              Sessão expirada
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              O laboratório ficou inativo por muito tempo. Recomece para continuar.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button type="button" onClick={finish} className="btn-secondary">
                Voltar à trilha
              </button>
              <button type="button" onClick={() => void lab.restart()} className="btn-primary">
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
