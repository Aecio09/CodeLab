import { useCallback, useEffect, useState } from 'react'

type Settings = {
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  highContrast: boolean
  grayscale: boolean
  highlightLinks: boolean
}

const STORAGE_KEY = 'codelab-access-settings'
const FONT_SIZE_MAP = { sm: '14px', md: '16px', lg: '18px', xl: '20px', xxl: '24px' }
const FONT_SIZE_LABELS: Record<string, string> = { sm: 'Pequena', md: 'Média', lg: 'Grande', xl: 'Muito Grande', xxl: 'Enorme' }
const FONT_SIZE_ORDER = ['sm', 'md', 'lg', 'xl', 'xxl'] as const

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { fontSize: 'md', highContrast: false, grayscale: false, highlightLinks: false }
}

function applySettings(settings: Settings) {
  const root = document.documentElement
  root.style.fontSize = FONT_SIZE_MAP[settings.fontSize]
  root.classList.toggle('access-high-contrast', settings.highContrast)
  root.classList.toggle('access-grayscale', settings.grayscale)
  root.classList.toggle('access-highlight-links', settings.highlightLinks)
}

export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    applySettings(settings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const update = useCallback((partial: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...partial }))
  }, [])

  const reset = useCallback(() => {
    const defaultSettings: Settings = { fontSize: 'md', highContrast: false, grayscale: false, highlightLinks: false }
    setSettings(defaultSettings)
  }, [])

  const cycleFontSize = useCallback(() => {
    setSettings(prev => {
      const idx = FONT_SIZE_ORDER.indexOf(prev.fontSize)
      const next = FONT_SIZE_ORDER[(idx + 1) % FONT_SIZE_ORDER.length]
      return { ...prev, fontSize: next }
    })
  }, [])

  const toggleClass = (active: boolean) =>
    `w-full flex items-center justify-between px-3 py-2.5 border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active
        ? 'bg-primary text-on-primary border-primary'
        : 'bg-background text-on-surface border-outline-variant hover:border-outline'
    }`

  const checkMark = (active: boolean) => (
    <span
      className={`w-4 h-4 border-2 flex items-center justify-center transition-colors ${
        active ? 'bg-on-primary border-on-primary' : 'border-outline'
      }`}
    >
      {active && <span className="material-symbols-outlined text-[12px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
    </span>
  )

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9999] w-12 h-12 flex items-center justify-center bg-primary text-on-primary shadow-2xl transition-transform duration-150 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Abrir recursos de acessibilidade"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>accessibility_new</span>
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-[9999] w-72 bg-surface-container border border-outline-variant p-4 shadow-2xl animate-panel-in"
          role="dialog"
          aria-label="Recursos de acessibilidade"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface">Acessibilidade</h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Fechar painel de acessibilidade"
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={cycleFontSize}
              className="flex items-center justify-between border border-outline-variant bg-background px-3 py-2.5 text-on-surface transition-colors hover:border-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Tamanho da fonte: ${FONT_SIZE_LABELS[settings.fontSize]}. Clique para alternar.`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">text_fields</span>
                <span className="text-sm">Fonte</span>
              </div>
              <span className="font-mono text-xs text-primary">{FONT_SIZE_LABELS[settings.fontSize]}</span>
            </button>

            <button
              onClick={() => update({ highContrast: !settings.highContrast })}
              className={toggleClass(settings.highContrast)}
              aria-pressed={settings.highContrast}
              aria-label={`Alto contraste: ${settings.highContrast ? 'ativado' : 'desativado'}`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" aria-hidden="true">contrast</span>
                <span className="text-sm">Alto Contraste</span>
              </div>
              {checkMark(settings.highContrast)}
            </button>

            <button
              onClick={() => update({ grayscale: !settings.grayscale })}
              className={toggleClass(settings.grayscale)}
              aria-pressed={settings.grayscale}
              aria-label={`Escala de cinza: ${settings.grayscale ? 'ativado' : 'desativado'}`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" aria-hidden="true">invert_colors</span>
                <span className="text-sm">Escala de Cinza</span>
              </div>
              {checkMark(settings.grayscale)}
            </button>

            <button
              onClick={() => update({ highlightLinks: !settings.highlightLinks })}
              className={toggleClass(settings.highlightLinks)}
              aria-pressed={settings.highlightLinks}
              aria-label={`Destacar links: ${settings.highlightLinks ? 'ativado' : 'desativado'}`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" aria-hidden="true">link</span>
                <span className="text-sm">Destacar Links</span>
              </div>
              {checkMark(settings.highlightLinks)}
            </button>
          </div>

          <button
            onClick={reset}
            className="mt-3 w-full border border-outline-variant px-3 py-2 text-xs uppercase tracking-wider text-on-surface-variant transition-colors hover:border-outline hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Redefinir
          </button>
        </div>
      )}
    </>
  )
}
