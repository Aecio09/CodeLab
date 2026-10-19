import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ApiError,
  deleteSession,
  getNetworkTrail,
  sendCliCommand,
  startNetworkQuestion,
  submitNetworkQuestion,
} from '../lib/networkLabApi'
import type {
  LabResult,
  NetDevice,
  NetLink,
  NetworkTrailItem,
} from '../types/network'

export type TerminalLine = {
  id: number
  kind: 'in' | 'out' | 'err' | 'event'
  prompt: string
  text: string
}

export type LabPhase = 'loading' | 'ready' | 'submitting' | 'result' | 'locked' | 'error'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro inesperado'
}

export function useNetworkLab(questionId: number) {
  const [phase, setPhase] = useState<LabPhase>('loading')
  const [question, setQuestion] = useState<NetworkTrailItem | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [devices, setDevices] = useState<NetDevice[]>([])
  const [links, setLinks] = useState<NetLink[]>([])
  const [selectedRef, setSelectedRef] = useState<string | null>(null)
  const [histories, setHistories] = useState<Record<string, TerminalLine[]>>({})
  const [prompts, setPrompts] = useState<Record<string, string>>({})
  const [input, setInput] = useState('')
  const [result, setResult] = useState<LabResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [sending, setSending] = useState(false)

  const startedRef = useRef(false)
  const lineIdRef = useRef(0)

  const pushLine = useCallback(
    (ref: string, line: Omit<TerminalLine, 'id'>) => {
      const id = ++lineIdRef.current
      setHistories((prev) => ({
        ...prev,
        [ref]: [...(prev[ref] ?? []), { ...line, id }],
      }))
    },
    []
  )

  const start = useCallback(async () => {
    setPhase('loading')
    setError(null)
    setResult(null)
    setSessionExpired(false)
    setHistories({})
    setPrompts({})
    setInput('')
    setElapsed(0)

    try {
      const trail = await getNetworkTrail()
      const found =
        trail.topics
          .flatMap((topic) => topic.questions)
          .find((item) => item.questionId === questionId) ?? null

      if (!found) {
        setError('Questão não encontrada na trilha.')
        setPhase('error')
        return
      }

      setQuestion(found)
      if (found.status === 'LOCKED') {
        setPhase('locked')
        return
      }

      const started = await startNetworkQuestion(questionId)
      const nextDevices = started.scenario.devices ?? []
      const nextLinks = started.scenario.links ?? []

      setSessionId(started.sessionId)
      setDevices(nextDevices)
      setLinks(nextLinks)
      setSelectedRef(nextDevices[0]?.ref ?? null)
      setPrompts(
        Object.fromEntries(nextDevices.map((device) => [device.ref, `${device.hostname}>`]))
      )
      setPhase('ready')
    } catch (err) {
      setError(errorMessage(err))
      setPhase('error')
    }
  }, [questionId])

  // O StrictMode monta o efeito duas vezes em dev; o guard evita duas sessões.
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void start()
  }, [start])

  useEffect(() => {
    if (phase !== 'ready' && phase !== 'submitting') return
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  const send = useCallback(
    async (raw: string) => {
      const line = raw.trim()
      if (!line || !sessionId || !selectedRef || phase !== 'ready' || sending) return

      const ref = selectedRef
      const prompt = prompts[ref] ?? '>'
      setSending(true)
      setError(null)
      setInput('')
      pushLine(ref, { kind: 'in', prompt, text: line })

      try {
        const res = await sendCliCommand(sessionId, ref, line)
        setPrompts((prev) => ({ ...prev, [ref]: res.prompt }))
        if (res.output) {
          pushLine(ref, { kind: 'out', prompt: '', text: res.output })
        }
        for (const event of res.events ?? []) {
          pushLine(ref, { kind: 'event', prompt: '', text: event.summary })
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setSessionExpired(true)
        } else {
          pushLine(ref, { kind: 'err', prompt: '', text: errorMessage(err) })
        }
      } finally {
        setSending(false)
      }
    },
    [sessionId, selectedRef, phase, prompts, pushLine, sending]
  )

  const submit = useCallback(async () => {
    if (!sessionId || phase !== 'ready' || sending) return
    setPhase('submitting')
    setError(null)

    try {
      const res = await submitNetworkQuestion(questionId, sessionId)
      setResult(res)
      setPhase('result')
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSessionExpired(true)
      } else {
        setError(errorMessage(err))
      }
      setPhase('ready')
    }
  }, [questionId, sessionId, phase, sending])

  const restart = useCallback(async () => {
    if (sessionId) {
      void deleteSession(sessionId).catch(() => {})
    }
    await start()
  }, [sessionId, start])

  const selectedDevice = devices.find((device) => device.ref === selectedRef) ?? null
  const lines = selectedRef ? histories[selectedRef] ?? [] : []
  const prompt =
    selectedRef && prompts[selectedRef]
      ? prompts[selectedRef]
      : selectedDevice
        ? `${selectedDevice.hostname}>`
        : '>'

  return {
    phase,
    question,
    sessionId,
    devices,
    links,
    selectedRef,
    selectedDevice,
    lines,
    prompt,
    input,
    result,
    error,
    sessionExpired,
    elapsed,
    sending,
    setSelectedRef,
    setInput,
    send,
    submit,
    restart,
    start,
  }
}
