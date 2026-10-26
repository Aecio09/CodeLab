import { DEFAULT_PLAYGROUND_CODE } from '../constants'
import type { QuestionItem } from '../types'

export const playgroundPrimaryButtonClass = [
  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded bg-white px-4',
  'font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-950',
  'shadow-[0_0_22px_rgba(255,255,255,0.15)] transition-all hover:bg-neutral-200',
  'active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-trail-background',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ')

export const playgroundSecondaryButtonClass = [
  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded border-[0.5px] border-trail-line',
  'bg-white/[0.04] px-3 font-mono text-[10px] uppercase tracking-wider text-neutral-300',
  'transition-colors hover:border-trail-accent hover:text-white',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-trail-background',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ')

export const playgroundDangerButtonClass = [
  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded border-[0.5px] border-red-500/20',
  'bg-red-500/[0.06] px-3 font-mono text-[10px] uppercase tracking-wider text-red-300',
  'transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-trail-background',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ')

export function buildPlaygroundInitialCode(question: QuestionItem, label: 'Desafio' | 'Questão') {
  if (question.starterCode && question.starterCode.trim()) {
    return question.starterCode
  }

  const prompt = question.questionBody.replaceAll('*/', '* /')
  return `/**\n * ${label} #${question.id}\n * ${prompt}\n */\n\n${DEFAULT_PLAYGROUND_CODE}`
}
