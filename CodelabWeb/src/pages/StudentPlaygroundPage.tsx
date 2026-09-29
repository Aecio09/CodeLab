import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL, DEFAULT_PLAYGROUND_CODE } from '../constants'
import { authFetch } from '../lib/api'
import type { AnswerReviewResponse, QuestionItem, UserProfile } from '../types'
import { PlaygroundShell } from '../components/PlaygroundShell'

const FINAL_STATUSES = ['APPROVED', 'AI_REJECTED', 'NODE_REJECTED'] as const

function isFinalStatus(status: string) {
    return FINAL_STATUSES.includes(status as (typeof FINAL_STATUSES)[number])
}

function isRejectedStatus(status: string) {
    return status === 'AI_REJECTED' || status === 'NODE_REJECTED'
}

const DIFFICULTY_LABEL: Record<string, string> = {
    EASY: 'Fácil',
    MEDIUM: 'Médio',
    HARD: 'Difícil',
}

export function StudentPlaygroundPage({ questionId }: { questionId: number }) {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [question, setQuestion] = useState<QuestionItem | null>(null)
    const [code, setCode] = useState(DEFAULT_PLAYGROUND_CODE)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [reviewResult, setReviewResult] = useState<AnswerReviewResponse | null>(null)

    const [seconds, setSeconds] = useState(0)
    const initializedQuestionCodeRef = useRef<number | null>(null)

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const meRes = await authFetch(`${API_BASE_URL}/api/users/me`)
                if (!meRes.ok) { window.location.href = '/'; return; }
                const me = await meRes.json()
                if (!cancelled) setUser(me)

                const qRes = await authFetch(`${API_BASE_URL}/questions/${questionId}`)
                if (!qRes.ok) throw new Error('load-question')
                const qData = await qRes.json()
                if (!cancelled) setQuestion(qData)
            } catch {
                if (!cancelled) alert('Falha ao carregar o sistema da Arena.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        void load()
        return () => { cancelled = true }
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

    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000)
        return () => clearInterval(interval)
    }, [])

    const formatTime = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
        const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
        const secs = (totalSeconds % 60).toString().padStart(2, '0')
        return `${hrs}:${mins}:${secs}`
    }

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
                    aiVerificationResult: data.message || 'Seu código não atende aos requisitos do desafio. Verifique a saída do sistema para mais detalhes.'
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
                } catch {}
                setTimeout(poll, 2000)
            }
            setTimeout(poll, 2000)
        } catch {
            setReviewResult({
                id: 0,
                answerBody: code,
                verificationStatus: 'ERROR',
                nodeVerificationResult: 'Erro de Conexão',
                aiVerificationResult: 'Não foi possível conectar ao servidor de validação. Verifique sua internet.'
            })
            setSubmitting(false)
        }
    }

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-background font-mono text-primary" role="status" aria-live="polite">
                Inicializando Arena...
            </div>
        )
    }

    const status = reviewResult?.verificationStatus

    return (
        <PlaygroundShell
            user={user}
            onUserChange={setUser}
            code={code}
            onCodeChange={setCode}
            loadingEditor={submitting}
            eyebrow="Desafio em curso"
            title={question?.topic?.replaceAll('_', ' ') ?? 'Carregando'}
            elapsed={formatTime(seconds)}
            primaryAction={
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary !h-9 !px-4 !text-[11px]">
                    {submitting ? 'Analisando...' : 'Enviar Resposta'}
                </button>
            }
            challenge={question?.questionBody ?? ''}
            difficulty={
                question ? (
                    <span className="shrink-0 border border-outline-variant px-3 py-1 font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                        {DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty}
                    </span>
                ) : null
            }
            editorStatus={
                reviewResult ? (
                    <span className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest ${
                        status === 'APPROVED' ? 'text-primary' : 'text-error'
                    }`}>
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">
                            {status === 'APPROVED' ? 'verified' : 'error'}
                        </span>
                        {status === 'APPROVED' ? 'Validado' : 'Revisão necessária'}
                    </span>
                ) : null
            }
            aside={
                reviewResult ? (
                    <section
                        aria-live="polite"
                        className={`shrink-0 border p-5 ${
                            status === 'APPROVED' ? 'border-primary/40 bg-surface-container-low' : 'border-error/40 bg-surface-container-low'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-base ${status === 'APPROVED' ? 'text-primary' : 'text-error'}`} aria-hidden="true">
                                {status === 'APPROVED' ? 'verified' : isRejectedStatus(status ?? '') ? 'dangerous' : 'report'}
                            </span>
                            <h2 className="font-mono text-xs uppercase tracking-widest text-on-surface">
                                {status === 'APPROVED' ? 'Relatório de verificação' : isRejectedStatus(status ?? '') ? 'Desafio recusado' : 'Erro de sistema'}
                            </h2>
                        </div>

                        <p className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap font-serif text-sm leading-relaxed text-on-surface-variant">
                            {reviewResult.aiVerificationResult}
                        </p>

                        {status === 'APPROVED' && (
                            <button onClick={() => { window.location.href = '/trilha' }} className="btn-primary mt-5 w-full">
                                Continuar Jornada
                            </button>
                        )}
                    </section>
                ) : null
            }
        />
    )
}
