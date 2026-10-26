import { useEffect, useState } from 'react'
import { API_BASE_URL, DEFAULT_PLAYGROUND_CODE } from '../constants'
import { authFetch } from '../lib/api'
import type { AnswerReviewResponse, QuestionItem, UserProfile } from '../types'
import { PlaygroundLoading, PlaygroundShell } from '../components/PlaygroundShell'
import { buildPlaygroundInitialCode, playgroundPrimaryButtonClass } from '../lib/playground'
import { difficultyLabel } from '../utils'

const FINAL_STATUSES = ['APPROVED', 'AI_REJECTED', 'NODE_REJECTED'] as const

function isFinalStatus(status: string) {
  return FINAL_STATUSES.includes(status as (typeof FINAL_STATUSES)[number])
}

function isRejectedStatus(status: string) {
  return status === 'AI_REJECTED' || status === 'NODE_REJECTED'
}

export function StudentPlaygroundPage({ questionId }: { questionId: number }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [question, setQuestion] = useState<QuestionItem | null>(null)
  const [code, setCode] = useState(DEFAULT_PLAYGROUND_CODE)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reviewResult, setReviewResult] = useState<AnswerReviewResponse | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const meRes = await authFetch(`${API_BASE_URL}/api/users/me`)
        if (!meRes.ok) {
          window.location.href = '/'
          return
        }
        const me = await meRes.json()
        if (!cancelled) setUser(me)

        const qRes = await authFetch(`${API_BASE_URL}/questions/${questionId}`)
        if (!qRes.ok) throw new Error('load-question')
        const qData = (await qRes.json()) as QuestionItem
        if (!cancelled) {
          setQuestion(qData)
          setCode(buildPlaygroundInitialCode(qData, 'Desafio'))
        }
      } catch {
        if (!cancelled) alert('Falha ao carregar o sistema da Arena.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [questionId])

  const handleSubmit = async () => {
    if (!question) return
    setSubmitting(true)
    setReviewResult(null)

    try {
      const response = await authFetch(`${API_BASE_URL}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, answerBody: code }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setReviewResult({
          id: 0,
          answerBody: code,
          verificationStatus: 'NODE_REJECTED',
          nodeVerificationResult: data.message || 'Falha na verificação.',
          aiVerificationResult:
            data.message ||
            'Seu código não atende aos requisitos do desafio. Verifique a saída do sistema para mais detalhes.',
        })
        setSubmitting(false)
        return
      }

      const result = await response.json()
      if (isFinalStatus(result.verificationStatus)) {
        setReviewResult(result)
        setSubmitting(false)
        return
      }

      let attempts = 0
      const maxAttempts = 30
      const poll = async () => {
        if (attempts >= maxAttempts) {
          setSubmitting(false)
          return
        }
        attempts += 1
        try {
          const pollRes = await authFetch(`${API_BASE_URL}/answers/${result.id}`)
          if (pollRes.ok) {
            const data = await pollRes.json()
            if (isFinalStatus(data.verificationStatus)) {
              setReviewResult(data)
              setSubmitting(false)
              return
            }
          }
        } catch {
          /* continua tentando até o limite */
        }
        setTimeout(poll, 2000)
      }
      setTimeout(poll, 2000)
    } catch {
      setReviewResult({
        id: 0,
        answerBody: code,
        verificationStatus: 'ERROR',
        nodeVerificationResult: 'Erro de Conexão',
        aiVerificationResult:
          'Não foi possível conectar ao servidor de validação. Verifique sua internet.',
      })
      setSubmitting(false)
    }
  }

  if (loading || !user) {
    return <PlaygroundLoading label="Inicializando Arena..." />
  }

  const status = reviewResult?.verificationStatus
  const approved = status === 'APPROVED'
  const rejected = isRejectedStatus(status ?? '')

  return (
    <PlaygroundShell
      user={user}
      onUserChange={setUser}
      code={code}
      onCodeChange={setCode}
      loadingEditor={submitting}
      eyebrow="Desafio em curso"
      title={question?.topic?.replaceAll('_', ' ') ?? 'Carregando'}
      challenge={question?.questionBody ?? ''}
      difficulty={
        question ? (
          <span className="shrink-0 rounded border-[0.5px] border-trail-line bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
            {difficultyLabel(question.difficulty)}
          </span>
        ) : null
      }
      editorStatus={
        reviewResult ? (
          <span
            className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${
              approved ? 'text-trail-cyan' : rejected ? 'text-red-300' : 'text-amber-300'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              {approved ? 'verified' : rejected ? 'error' : 'report'}
            </span>
            {approved ? 'Validado' : rejected ? 'Revisão necessária' : 'Erro de sistema'}
          </span>
        ) : null
      }
      primaryAction={{
        label: 'Enviar Resposta',
        loadingLabel: 'Analisando...',
        icon: 'send',
        onClick: () => {
          void handleSubmit()
        },
        disabled: submitting || !question,
        loading: submitting,
      }}
      aside={
        reviewResult ? (
          <section
            aria-live="polite"
            className={`shrink-0 rounded-lg border-[0.5px] p-4 ${
              approved
                ? 'border-cyan-400/20 bg-cyan-400/[0.04]'
                : rejected
                  ? 'border-red-500/20 bg-red-500/[0.06]'
                  : 'border-amber-400/20 bg-amber-400/[0.05]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-[16px] ${
                  approved ? 'text-trail-cyan' : rejected ? 'text-red-300' : 'text-amber-300'
                }`}
                aria-hidden="true"
              >
                {approved ? 'verified' : rejected ? 'dangerous' : 'report'}
              </span>
              <h2 className="font-mono text-[10px] uppercase tracking-wider text-white">
                {approved
                  ? 'Relatório de verificação'
                  : rejected
                    ? 'Desafio recusado'
                    : 'Erro de sistema'}
              </h2>
            </div>

            <p className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs font-light leading-relaxed text-neutral-400">
              {reviewResult.aiVerificationResult}
            </p>

            {approved ? (
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/trilha'
                }}
                className={`${playgroundPrimaryButtonClass} mt-4 w-full`}
              >
                Continuar Jornada
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  arrow_forward
                </span>
              </button>
            ) : null}
          </section>
        ) : null
      }
    />
  )
}
