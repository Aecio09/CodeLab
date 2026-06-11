export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const DEFAULT_PLAYGROUND_CODE = `function solve(input: unknown): unknown {
  return input
}

console.log(solve('teste'))
`

export const TOPIC_OPTIONS = [
  'OPERADORES_TIPOS_E_VARIAVEIS',
  'EXECUCAO_CONDICIONAL',
  'OPERADORES_LOGICOS',
  'LACOS',
  'SUBPROGRAMAS',
  'VETORES',
  'ARRAYS',
  'TIPOS_CRIADOS_PELO_PROGRAMADOR',
] as const

export const TYPE_OPTIONS = ['MULTIPLE_CHOICE', 'PRACTICAL'] as const
export const DIFFICULTY_OPTIONS = ['EASY', 'MEDIUM', 'HARD'] as const
