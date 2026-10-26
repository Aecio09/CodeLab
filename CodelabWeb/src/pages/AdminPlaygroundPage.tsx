import { useEffect, useState } from 'react'
import { API_BASE_URL, DEFAULT_PLAYGROUND_CODE } from '../constants'
import { authFetch } from '../lib/api'
import type { AnswerReviewResponse, QuestionItem, ReviewApiError, UserProfile } from '../types'
import { PlaygroundLoading, PlaygroundShell } from '../components/PlaygroundShell'
import { buildPlaygroundInitialCode, playgroundPrimaryButtonClass } from '../lib/playground'
import { difficultyLabel, topicLabel } from '../utils'

export function AdminPlaygroundPage({ questionId }: { questionId: number }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [question, setQuestion] = useState<QuestionItem | null>(null)
  const [code, setCode] = useState(DEFAULT_PLAYGROUND_CODE)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reviewResult, setReviewResult] = useState<AnswerReviewResponse | null>(null)
  const [reviewError, setReviewError] = useState<ReviewApiError | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const meResponse = await authFetch(`${API_BASE_URL}/api/users/me`)
        if (!meResponse.ok) {
          window.location.href = '/'
          return
        }

        const me = (await meResponse.json()) as UserProfile
        if (cancelled) return
        setProfile(me)

        const questionResponse = await authFetch(`${API_BASE_URL}/questions/${questionId}`)
        if (!questionResponse.ok) {
          throw new Error('load-question')
        }

        const questionData = (await questionResponse.json()) as QuestionItem
        if (!cancelled) {
          setQuestion(questionData)
          setCode(buildPlaygroundInitialCode(questionData, 'Questão'))
        }
      } catch {
        if (!cancelled) {
          setError('Não foi possível carregar a questão para o playground.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [questionId])

  const handleSubmitForReview = async () => {
    if (!question) return

    setSubmitting(true)
    setError('')
    setReviewResult(null)
    setReviewError(null)

    try {
      const response = await authFetch(`${API_BASE_URL}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.id,
          answerBody: code,
        }),
      })

      if (response.ok) {
        const result = (await response.json()) as AnswerReviewResponse
        setReviewResult(result)
        return
      }

      const data = (await response.json()) as Partial<ReviewApiError>
      setReviewError({
        code: data.code ?? 'REVIEW_ERROR',
        message: data.message ?? 'Falha na revisão.',
        status: data.status ?? response.status,
      })
    } catch {
      setError('Não foi possível conectar ao endpoint de revisão.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !profile) {
    return <PlaygroundLoading label="Carregando playground de revisão..." />
  }

  const approved = reviewResult?.verificationStatus === 'APPROVED'
  const backHref = profile.role === 'ADMIN' ? '/admin/questions' : '/trilha'

  return (
    <PlaygroundShell
      user={profile}
      onUserChange={setProfile}
      code={code}
      onCodeChange={setCode}
      loadingEditor={loading || submitting}
      eyebrow={`Questão #${questionId}`}
      title={question ? topicLabel(question.topic) : 'Revisão de questão'}
      challenge={question?.questionBody ?? 'Carregando questão...'}
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
              approved ? 'text-trail-cyan' : 'text-red-300'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              {approved ? 'verified' : 'error'}
            </span>
            {approved ? 'Aprovado' : 'Revisão necessária'}
          </span>
        ) : null
      }
      secondaryAction={{
        label: 'Voltar',
        icon: 'arrow_back',
        onClick: () => {
          window.location.href = backHref
        },
      }}
      primaryAction={{
        label: 'Enviar para revisão',
        loadingLabel: 'Enviando...',
        icon: 'send',
        onClick: () => {
          void handleSubmitForReview()
        },
        disabled: submitting || loading || !question,
        loading: submitting,
      }}
      showPreview
      previewLabel="Validação imediata"
      showTimer={false}
      consoleLabel="Console"
      aside={
        <div className="space-y-3">
          {loading ? (
            <p className="font-mono text-[11px] text-trail-muted" role="status" aria-live="polite">
              Carregando...
            </p>
          ) : null}

          {error ? (
            <p
              className="rounded-lg border-[0.5px] border-red-500/20 bg-red-500/[0.06] p-3 text-xs leading-relaxed text-red-300"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {reviewResult ? (
            <section
              className="space-y-3 rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 p-4"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    approved ? 'text-trail-cyan' : 'text-red-300'
                  }`}
                  aria-hidden="true"
                >
                  fact_check
                </span>
                <h2 className="font-mono text-[10px] uppercase tracking-wider text-white">
                  Resultado da revisão
                </h2>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">
                  Status
                </p>
                <p
                  className={`mt-1 font-mono text-xs font-bold uppercase tracking-wider ${
                    approved ? 'text-trail-cyan' : 'text-red-300'
                  }`}
                >
                  {reviewResult.verificationStatus}
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">
                  Node
                </p>
                <p className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-neutral-400">
                  {reviewResult.nodeVerificationResult ?? '-'}
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">
                  IA
                </p>
                <p className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-neutral-400">
                  {reviewResult.aiVerificationResult ?? '-'}
                </p>
              </div>

              {approved ? (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/trilha'
                  }}
                  className={`${playgroundPrimaryButtonClass} w-full`}
                >
                  Voltar para a Trilha
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </button>
              ) : null}
            </section>
          ) : null}

          {reviewError ? (
            <section
              className="space-y-1 rounded-lg border-[0.5px] border-red-500/20 bg-red-500/[0.06] p-4"
              role="alert"
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-red-300">
                {reviewError.code}
              </p>
              <p className="text-xs leading-relaxed text-red-200">{reviewError.message}</p>
              <p className="font-mono text-[10px] text-red-300/70">HTTP {reviewError.status}</p>
            </section>
          ) : null}

          {!reviewResult && !reviewError && !loading && !error ? (
            <p className="rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 p-3 text-xs leading-relaxed text-trail-muted">
              Envie o código para ver o resultado da correção.
            </p>
          ) : null}
        </div>
      }
    />
  )
}
