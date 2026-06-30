import { useEffect, useRef, useState } from 'react'
import {
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from '@codesandbox/sandpack-react'
import { API_BASE_URL, DEFAULT_PLAYGROUND_CODE } from '../constants'
import type { AnswerReviewResponse, QuestionItem, ReviewApiError, UserProfile } from '../types'
import { PlaygroundCodeEditor } from '../components/PlaygroundCodeEditor'

export function AdminPlaygroundPage({ questionId }: { questionId: number }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [question, setQuestion] = useState<QuestionItem | null>(null)
  const [code, setCode] = useState(DEFAULT_PLAYGROUND_CODE)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reviewResult, setReviewResult] = useState<AnswerReviewResponse | null>(null)
  const [reviewError, setReviewError] = useState<ReviewApiError | null>(null)
  const initializedQuestionCodeRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const meResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
          credentials: 'include',
        })
        if (!meResponse.ok) {
          window.location.href = '/'
          return
        }

        const me = (await meResponse.json()) as UserProfile
        if (cancelled) return
        setProfile(me)

        const questionResponse = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
          credentials: 'include',
        })
        if (!questionResponse.ok) {
          throw new Error('load-question')
        }

        const questionData = (await questionResponse.json()) as QuestionItem
        if (!cancelled) {
          setQuestion(questionData)
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

  useEffect(() => {
    if (!question) return
    if (initializedQuestionCodeRef.current === question.id) return

    if (question.starterCode && question.starterCode.trim()) {
      setCode(question.starterCode)
    } else {
      const prompt = question.questionBody.replaceAll('*/', '* /')
      setCode(`/**\n * Questão #${question.id}\n * ${prompt}\n */\n\n${DEFAULT_PLAYGROUND_CODE}`)
    }
    initializedQuestionCodeRef.current = question.id
  }, [question])

  const handleSubmitForReview = async () => {
    if (!question) return

    setSubmitting(true)
    setError('')
    setReviewResult(null)
    setReviewError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/answers`, {
        method: 'POST',
        credentials: 'include',
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

  return (
    <>
      <header className="flex justify-between items-center h-16 px-gutter w-full sticky top-0 z-30 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-md">
          <span className="text-lg font-h2 font-bold text-primary tracking-tight">CodeLab</span>
          <div className="h-6 w-[1px] bg-outline-variant mx-sm"></div>
          <span className="font-label text-label text-on-surface-variant tracking-wider">Playground</span>
        </div>
        <div className="flex items-center gap-md">
          <button
            type="button"
            className="btn-secondary !h-9 !px-md"
            onClick={() => {
              window.location.href = profile?.role === 'ADMIN' ? '/admin/questions' : '/trilha'
            }}
          >
            Voltar
          </button>
          <div className="text-right">
            <p className="text-body-sm text-on-surface">{profile?.name ?? 'Administrador'}</p>
            <p className="text-label text-on-surface-variant">{profile?.email ?? ''}</p>
          </div>
        </div>
      </header>

      <SandpackProvider
        template="vanilla-ts"
        theme="dark"
        files={{
          '/index.ts': code,
        }}
        customSetup={{ entry: '/index.ts' }}
      >
        <main className="flex-1 flex overflow-hidden">
          <section className="flex-1 flex flex-col border-r border-outline-variant min-w-0">
            <div className="h-12 bg-surface-container-low flex items-center justify-between px-md border-b border-outline-variant">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">terminal</span>
                <span className="font-label text-label text-on-surface">answer.ts</span>
              </div>
              <button
                type="button"
                className="btn-primary !h-9 !px-md"
                onClick={handleSubmitForReview}
                disabled={submitting || loading || !question}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                {submitting ? 'Enviando...' : 'Enviar para revisão'}
              </button>
            </div>

            <div className="flex-1 p-gutter bg-surface-container-lowest overflow-auto">
              <div className="mb-md space-y-xs">
                <p className="text-label text-on-surface-variant uppercase">Questão #{questionId}</p>
                <p className="text-body-sm text-on-surface">{question?.questionBody ?? 'Carregando questão...'}</p>
              </div>

              <SandpackLayout className="!bg-transparent !border-outline-variant !rounded-xl !overflow-hidden !border">
                <PlaygroundCodeEditor loading={loading} onCodeChange={setCode} />
              </SandpackLayout>
            </div>
          </section>

          <aside className="w-[420px] bg-surface flex flex-col">
            <div className="h-12 bg-surface-container flex items-center px-md border-b border-outline-variant">
              <span className="font-label text-label text-on-surface uppercase tracking-tight">Validação Imediata</span>
            </div>

            <div className="p-md border-b border-outline-variant bg-surface-container-low">
              <SandpackLayout className="!bg-transparent !border-0 !rounded-none !flex-col !gap-md">
                <div className="h-32 overflow-hidden rounded-lg border border-outline-variant">
                  <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} />
                </div>
                <div className="max-h-40 overflow-auto rounded-lg border border-outline-variant">
                  <SandpackConsole resetOnPreviewRestart />
                </div>
              </SandpackLayout>
            </div>

            <div className="h-12 bg-surface-container flex items-center px-md border-b border-outline-variant">
              <span className="font-label text-label text-on-surface uppercase tracking-tight">Resultado da Revisão</span>
            </div>
            <div className="flex-1 p-gutter space-y-md overflow-auto">
              {loading ? <p className="text-on-surface-variant">Carregando...</p> : null}
              {error ? <p className="text-error">{error}</p> : null}

              {reviewResult ? (
                <div className="bg-surface-container border border-outline-variant rounded-xl p-md space-y-sm">
                  <p className="text-label text-on-surface-variant uppercase">Status</p>
                  <p className={`text-h3 font-h3 font-bold ${reviewResult.verificationStatus === 'APPROVED' ? 'text-primary' : 'text-error'}`}>
                    {reviewResult.verificationStatus}
                  </p>
                  <p className="text-label text-on-surface-variant uppercase">Node</p>
                  <p className="text-body-sm text-on-surface">{reviewResult.nodeVerificationResult ?? '-'}</p>
                  <p className="text-label text-on-surface-variant uppercase">IA</p>
                  <p className="text-body-sm text-on-surface">{reviewResult.aiVerificationResult ?? '-'}</p>
                  
                  {reviewResult.verificationStatus === 'APPROVED' && (
                    <button
                      onClick={() => (window.location.href = '/trilha')}
                      className="btn-primary w-full mt-4 !h-10"
                    >
                      Voltar para a Trilha
                    </button>
                  )}
                </div>
              ) : null}

              {reviewError ? (
                <div className="bg-error-container border border-error rounded-xl p-md space-y-xs">
                  <p className="text-label text-on-error-container uppercase">{reviewError.code}</p>
                  <p className="text-body-sm text-on-error-container">{reviewError.message}</p>
                  <p className="text-label text-on-error-container">HTTP {reviewError.status}</p>
                </div>
              ) : null}

              {!reviewResult && !reviewError && !loading ? (
                <p className="text-on-surface-variant text-body-sm">Envie o código para ver o resultado da correção.</p>
              ) : null}
            </div>
          </aside>
        </main>
      </SandpackProvider>
    </>
  )
}
