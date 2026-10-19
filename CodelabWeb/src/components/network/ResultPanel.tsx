import type { LabCheck, LabResult } from '../../types/network'

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-result-title"
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-outline-variant bg-surface-container p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span
            className={`material-symbols-outlined text-[40px] ${
              approved ? 'text-primary' : 'text-error'
            }`}
          >
            {approved ? 'check_circle' : 'cancel'}
          </span>
          <div>
            <h2
              id="lab-result-title"
              className={`text-lg font-black ${approved ? 'text-primary' : 'text-error'}`}
            >
              {approved ? 'Lab aprovado!' : 'Ainda não foi'}
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant">
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
                className={`rounded-lg border px-3 py-2 text-xs ${
                  check.passed
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-error/40 bg-error/5'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      check.passed ? 'text-primary' : 'text-error'
                    }`}
                  >
                    {check.passed ? 'check' : 'close'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-on-surface">{check.field}</p>
                    {!check.passed && (
                      <p className="mt-0.5 break-words text-on-surface-variant">
                        esperado: <span className="text-primary">{formatValue(check.expected)}</span>
                        {' · '}
                        encontrado: <span className="text-error">{formatValue(check.actual)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onBack} className="btn-secondary">
            Voltar à trilha
          </button>
          {approved ? (
            hasNext && (
              <button type="button" onClick={onNext} className="btn-primary">
                Próximo lab
              </button>
            )
          ) : (
            <button type="button" onClick={onRestart} className="btn-primary">
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
