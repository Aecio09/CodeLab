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

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Abrir recursos de acessibilidade"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>accessibility_new</span>
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-[9999] w-72 bg-surface-container border border-outline-variant rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label="Recursos de acessibilidade"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-h3 text-h3 text-on-surface font-bold">Acessibilidade</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Fechar painel de acessibilidade"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Fonte */}
            <button
              onClick={cycleFontSize}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-container-highest rounded-xl hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Tamanho da fonte: ${FONT_SIZE_LABELS[settings.fontSize]}. Clique para alternar.`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">text_fields</span>
                <span className="font-body-sm text-body-sm text-on-surface">Fonte</span>
              </div>
              <span className="font-label text-label text-primary font-semibold">{FONT_SIZE_LABELS[settings.fontSize]}</span>
            </button>

            {/* Alto Contraste */}
            <button
              onClick={() => update({ highContrast: !settings.highContrast })}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                settings.highContrast ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-surface-container-highest hover:brightness-110'
              }`}
              aria-pressed={settings.highContrast}
              aria-label={`Alto contraste: ${settings.highContrast ? 'ativado' : 'desativado'}`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">contrast</span>
                <span className="font-body-sm text-body-sm text-on-surface">Alto Contraste</span>
              </div>
              <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                settings.highContrast ? 'bg-primary border-primary' : 'border-outline'
              }`}>
                {settings.highContrast && <span className="material-symbols-outlined text-[14px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
              </span>
            </button>

            {/* Escala de Cinza */}
            <button
              onClick={() => update({ grayscale: !settings.grayscale })}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                settings.grayscale ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-surface-container-highest hover:brightness-110'
              }`}
              aria-pressed={settings.grayscale}
              aria-label={`Escala de cinza: ${settings.grayscale ? 'ativado' : 'desativado'}`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">invert_colors</span>
                <span className="font-body-sm text-body-sm text-on-surface">Escala de Cinza</span>
              </div>
              <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                settings.grayscale ? 'bg-primary border-primary' : 'border-outline'
              }`}>
                {settings.grayscale && <span className="material-symbols-outlined text-[14px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
              </span>
            </button>

            {/* Destacar Links */}
            <button
              onClick={() => update({ highlightLinks: !settings.highlightLinks })}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                settings.highlightLinks ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-surface-container-highest hover:brightness-110'
              }`}
              aria-pressed={settings.highlightLinks}
              aria-label={`Destacar links: ${settings.highlightLinks ? 'ativado' : 'desativado'}`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">link</span>
                <span className="font-body-sm text-body-sm text-on-surface">Destacar Links</span>
              </div>
              <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                settings.highlightLinks ? 'bg-primary border-primary' : 'border-outline'
              }`}>
                {settings.highlightLinks && <span className="material-symbols-outlined text-[14px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
              </span>
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={reset}
            className="w-full mt-3 px-3 py-2 rounded-xl text-label text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Redefinir
          </button>
        </div>
      )}
    </>
  )
}
