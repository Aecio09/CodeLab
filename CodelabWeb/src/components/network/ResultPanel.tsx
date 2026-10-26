import type { LabCheck, LabResult } from '../../types/network'
import {
  playgroundPrimaryButtonClass,
  playgroundSecondaryButtonClass,
} from '../../lib/playground'

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'boolean') return value ? 'sim' : 'não'
  if (typeof value === 'number') return String(value)
  return JSON.stringify(value)
}

type Props = {
  result: LabResult
  hasNext: boolean
  onRestart: () => void
  onNext: () => void
  onBack: () => void
}

export function ResultPanel({ result, hasNext, onRestart, onNext, onBack }: Props) {
  const approved = result.result.verdict === 'APPROVED'
  const checks: LabCheck[] = result.result.checks ?? []

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-trail-background/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-result-title"
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span
            className={`material-symbols-outlined text-[40px] ${
              approved ? 'text-trail-cyan' : 'text-red-300'
            }`}
            aria-hidden="true"
          >
            {approved ? 'check_circle' : 'cancel'}
          </span>
          <div>
            <h2
              id="lab-result-title"
              className={`font-serif text-2xl ${approved ? 'text-white' : 'text-red-300'}`}
            >
              {approved ? 'Lab aprovado!' : 'Ainda não foi'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-trail-muted">
              {approved
                ? 'A configuração final da rede atende ao gabarito.'
                : 'A rede não chegou ao estado esperado. Revise os itens abaixo.'}
            </p>
          </div>
        </div>

        {checks.length > 0 && (
          <ul className="mt-5 space-y-2">
            {checks.map((check, index) => (
              <li
                key={`${check.field}-${index}`}
                className={`rounded-lg border-[0.5px] px-3 py-2 text-xs ${
                  check.passed
                    ? 'border-cyan-400/20 bg-cyan-400/[0.04]'
                    : 'border-red-500/20 bg-red-500/[0.04]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      check.passed ? 'text-trail-cyan' : 'text-red-300'
                    }`}
                    aria-hidden="true"
                  >
                    {check.passed ? 'check' : 'close'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] font-semibold text-neutral-200">
                      {check.field}
                    </p>
                    {!check.passed && (
                      <p className="mt-0.5 break-words text-xs leading-relaxed text-trail-muted">
                        esperado:{' '}
                        <span className="font-mono text-trail-cyan">
                          {formatValue(check.expected)}
                        </span>
                        {' · '}
                        encontrado:{' '}
                        <span className="font-mono text-red-300">
                          {formatValue(check.actual)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onBack} className={playgroundSecondaryButtonClass}>
            Voltar à trilha
          </button>
          {approved ? (
            hasNext && (
              <button type="button" onClick={onNext} className={playgroundPrimaryButtonClass}>
                Próximo lab
              </button>
            )
          ) : (
            <button type="button" onClick={onRestart} className={playgroundPrimaryButtonClass}>
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
