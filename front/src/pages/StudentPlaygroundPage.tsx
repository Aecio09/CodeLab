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

export function StudentPlaygroundPage({ questionId }: { questionId: number }) {
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
          setError('Não foi possível carregar o desafio.')
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
      setCode(`/**\n * Desafio #${question.id}\n * ${prompt}\n */\n\n${DEFAULT_PLAYGROUND_CODE}`)
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
      setError('Não foi possível conectar ao servidor de correção.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="flex justify-between items-center h-16 px-gutter w-full sticky top-0 z-30 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-md">
          <span className="font-h2 text-h2 font-extrabold text-primary">CodeLab</span>
          <div className="h-6 w-[1px] bg-outline-variant mx-sm"></div>
          <span className="font-label text-label text-on-surface-variant tracking-wider uppercase">Desafio</span>
        </div>
        <div className="flex items-center gap-md">
          <button
            type="button"
            className="border border-outline-variant px-md py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high"
            onClick={() => {
              window.location.href = '/trilha'
            }}
          >
            Sair
          </button>
          <div className="text-right">
            <p className="text-body-sm text-on-surface">{profile?.name ?? 'Estudante'}</p>
            <p className="text-label text-on-surface-variant">{profile?.userPoints ?? 0} XP</p>
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
                <span className="font-label text-label text-on-surface">resposta.ts</span>
              </div>
              <button
                type="button"
                className="flex items-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary font-label font-bold hover:brightness-110 transition-all disabled:opacity-70"
                onClick={handleSubmitForReview}
                disabled={submitting || loading || !question}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                {submitting ? 'Verificar Código' : 'Enviar Resposta'}
              </button>
            </div>

            <div className="flex-1 p-gutter bg-surface-container-lowest overflow-auto">
              <div className="mb-md p-md bg-surface-container rounded-xl border border-outline-variant">
                <p className="text-label text-primary uppercase font-bold mb-xs">Objetivo do Desafio</p>
                <p className="text-body-md text-on-surface whitespace-pre-wrap">{question?.questionBody ?? 'Carregando enunciado...'}</p>
              </div>

              <SandpackLayout className="!bg-transparent !border-outline-variant !rounded-xl !overflow-hidden !border">
                <PlaygroundCodeEditor loading={loading} onCodeChange={setCode} />
              </SandpackLayout>
            </div>
          </section>

          <aside className="w-[420px] bg-surface flex flex-col">
            <div className="h-12 bg-surface-container flex items-center px-md border-b border-outline-variant">
              <span className="font-label text-label text-on-surface uppercase tracking-tight">Console de Saída</span>
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
              <span className="font-label text-label text-on-surface uppercase tracking-tight">Resultado da Avaliação</span>
            </div>
            <div className="flex-1 p-gutter space-y-md overflow-auto">
              {loading ? <p className="text-on-surface-variant">Carregando...</p> : null}
              {error ? <p className="text-error">{error}</p> : null}

              {reviewResult ? (
                <div className={`bg-surface-container border rounded-xl p-md space-y-sm ${reviewResult.verificationStatus === 'APPROVED' ? 'border-[#72db9f]/50' : 'border-primary/50'}`}>
                  <p className="text-label text-on-surface-variant uppercase">Status</p>
                  <p className={`text-h3 font-bold ${reviewResult.verificationStatus === 'APPROVED' ? 'text-[#72db9f]' : 'text-primary'}`}>
                    {reviewResult.verificationStatus === 'APPROVED' ? 'SUCESSO!' : 'TENTE NOVAMENTE'}
                  </p>
                  
                  <div className="space-y-xs">
                    <p className="text-label text-on-surface-variant uppercase">Feedback da IA</p>
                    <p className="text-body-sm text-on-surface bg-surface-container-highest p-sm rounded-lg italic">
                      "{reviewResult.aiVerificationResult ?? 'Sem feedback adicional.'}"
                    </p>
                  </div>

                  {reviewResult.verificationStatus === 'APPROVED' && (
                    <button
                      onClick={() => (window.location.href = '/trilha')}
                      className="w-full mt-4 bg-[#72db9f] text-[#003920] py-3 rounded-lg font-bold hover:brightness-110 transition-all shadow-lg active:scale-95"
                    >
                      Continuar Trilha
                    </button>
                  )}
                </div>
              ) : null}

              {reviewError ? (
                <div className="bg-error-container border border-error rounded-xl p-md space-y-xs">
                  <p className="text-label text-on-error-container uppercase">{reviewError.code}</p>
                  <p className="text-body-sm text-on-error-container">{reviewError.message}</p>
                </div>
              ) : null}

              {!reviewResult && !reviewError && !loading ? (
                <p className="text-on-surface-variant text-body-sm">Execute o seu código no console e, quando estiver pronto, clique em <b>Enviar Resposta</b> para validar.</p>
              ) : null}
            </div>
          </aside>
        </main>
      </SandpackProvider>
    </>
  )
}
