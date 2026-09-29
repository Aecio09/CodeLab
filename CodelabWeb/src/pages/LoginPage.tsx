import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../constants'
import { apiLogin, authFetch, getToken } from '../lib/api'
import { SharedFooter } from '../components/SharedFooter'

type LoginPageProps = {
  registered: boolean
}

const APRENDIZAGEM = [
  { label: 'Módulos', value: '8' },
  { label: 'Execução', value: 'No navegador' },
  { label: 'Correção', value: 'Automática com Feedback' },
]

const CONFORMIDADE = [
  { title: 'WCAG 2.1', detail: 'Nível AA' },
  { title: 'LBI', detail: 'Lei 13.146/2015' },
  { title: 'Teclado', detail: 'Navegação total' },
  { title: 'PT-BR', detail: 'Interface local' },
]

export function LoginPage({ registered }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (!getToken()) return
    authFetch(`${API_BASE_URL}/api/users/me`)
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json()
          if (data.role === 'ADMIN') {
            window.location.href = '/admin/questions'
          } else {
            window.location.href = '/trilha'
          }
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setLoginError('')

    try {
      await apiLogin(email, password)
      const meRes = await authFetch(`${API_BASE_URL}/api/users/me`)
      if (meRes.ok) {
        const me = await meRes.json()
        if (me.role === 'ADMIN') {
          window.location.href = '/admin/questions'
        } else {
          window.location.href = '/trilha'
        }
      } else {
        window.location.href = '/trilha'
      }
    } catch {
      setLoginError('Email ou senha inválidos.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-outline-variant bg-background px-6 py-4 md:px-12">
        <div className="flex items-center justify-between">
          <a href="/" className="group flex items-center gap-3" aria-label="CodeLab — página inicial">
            <span className="flex h-8 w-8 items-center justify-center border border-outline-variant transition-colors group-hover:border-primary">
              <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                terminal
              </span>
            </span>
            <span className="font-serif text-2xl font-normal tracking-tight text-primary">CodeLab</span>
          </a>

          <a
            href="/register"
            className="border border-outline-variant px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition-colors duration-150 hover:border-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Criar conta
          </a>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-stretch lg:grid-cols-12">
        <section className="order-2 flex flex-col justify-between border-outline-variant p-8 md:p-14 lg:order-1 lg:col-span-7 lg:border-r lg:p-16">
          <div className="flex flex-col gap-6">
            <div className="inline-flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Trilhas de aprendizado</span>
              <span className="h-px w-6 bg-outline-variant" aria-hidden="true"></span>
              <span className="font-mono text-xs uppercase text-outline">Do básico ao avançado</span>
            </div>

            <div className="max-w-xl">
              <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-primary sm:text-4xl lg:text-5xl">
               CodeLab, uma plataforma para aprender tecnologia na prática.
              </h1>
              <p className="mt-5 max-w-lg font-sans text-base leading-relaxed text-on-surface-variant">
               Uma plataforma de aprendizado de tecnologia que oferece trilhas de estudo práticas e interativas, permitindo que os alunos aprendam no seu próprio ritmo e recebam feedback imediato por meio de correção automatizada.
              </p>
            </div>
          </div>

          <div className="my-10 max-w-xl">
            <div className="border border-outline-variant bg-surface-container-low p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between border-b border-outline-variant pb-3">
                <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Como funciona</span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-primary">
                  <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">schedule</span>
                  Ritmo próprio
                </span>
              </div>
              <div className="grid grid-cols-2 gap-6 text-left md:grid-cols-3">
                {APRENDIZAGEM.map((item) => (
                  <div key={item.label}>
                    <div className="text-[0.6875rem] font-medium uppercase tracking-wider text-outline">{item.label}</div>
                    <div className="mt-1 text-lg font-semibold text-primary">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant pt-6">
            <div className="mb-4 text-[0.6875rem] font-medium uppercase tracking-widest text-outline">
              Acessibilidade e conformidade
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CONFORMIDADE.map((item) => (
                <div key={item.title} className="border border-outline-variant bg-surface-container-low px-3 py-2.5 text-center">
                  <span className="block text-xs font-semibold text-primary">{item.title}</span>
                  <span className="text-[0.625rem] uppercase tracking-wider text-on-surface-variant">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="order-1 flex items-center justify-center border-t border-outline-variant p-8 md:p-12 lg:order-2 lg:col-span-5 lg:border-t-0 lg:p-14">
          <div className="w-full max-w-md border border-outline-variant bg-surface-container-low p-8 shadow-2xl md:p-10">
            <header className="mb-7">
              <div className="mb-3 inline-block border border-outline px-2.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-widest text-on-surface-variant">
                Portal do aluno
              </div>
              <h2 className="font-serif text-2xl font-normal text-primary sm:text-3xl">Acesse sua conta</h2>
              <p className="mt-1.5 text-sm leading-normal text-on-surface-variant">
                Entre com suas credenciais para continuar sua trilha.
              </p>
            </header>

            {registered && (
              <p
                className="mb-5 flex items-start gap-2 border border-outline-variant bg-background px-3 py-2.5 text-xs text-on-surface"
                aria-live="polite"
              >
                <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">check_circle</span>
                <span>Cadastro realizado. Faça login para continuar.</span>
              </p>
            )}

            {loginError && (
              <p className="mb-5 flex items-start gap-2 border border-error bg-error-container px-3 py-2.5 text-xs text-on-error-container" role="alert">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
                <span>{loginError}</span>
              </p>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  className="input-field"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="form-label" htmlFor="password">
                    Senha
                  </label>
                  <span className="text-xs text-on-surface-variant">Esqueceu a senha?</span>
                </div>
                <div className="relative">
                  <input
                    className="input-field pr-10"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-outline transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                className="btn-primary mt-6 w-full py-3"
                type="submit"
                disabled={submitting}
              >
                <span>{submitting ? 'Entrando...' : 'Entrar'}</span>
                <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
              </button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-outline-variant"></div>
              <span className="absolute bg-surface-container-low px-3 text-[0.6875rem] uppercase tracking-wider text-outline">
                ou continue com
              </span>
            </div>

            <a
              className="btn-secondary w-full py-2.5"
              href={`${API_BASE_URL}/oauth2/authorization/google`}
            >
              <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.35 1.22 8.33 3.22l6.2-6.2C34.68 2.82 29.74 1 24 1 14.82 1 6.73 6.98 3.36 15.36l7.48 5.8C12.67 14.37 17.91 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.43-4.74H24v9h12.66c-.55 2.96-2.2 5.47-4.7 7.16l7.27 5.66C43.97 37.18 46.5 31.41 46.5 24.5z" />
                <path fill="#FBBC05" d="M10.84 28.16A14.5 14.5 0 019.5 24c0-1.45.25-2.85.7-4.16l-7.48-5.8A23.97 23.97 0 001.5 24c0 3.77.9 7.34 2.72 10.53l7.62-6.37z" />
                <path fill="#34A853" d="M24 47c6.48 0 11.92-2.14 15.9-5.82l-7.27-5.66c-2.02 1.36-4.6 2.17-8.63 2.17-6.08 0-11.32-4.87-13.16-11.66l-7.62 6.37C6.73 41.02 14.82 47 24 47z" />
              </svg>
              Entrar com o Google
            </a>

            <div className="mt-6 border-t border-outline-variant pt-4 text-center">
              <p className="text-xs text-on-surface-variant">
                Não tem uma conta?
                <a
                  className="ml-1 font-semibold text-primary underline-offset-4 hover:underline"
                  href="/register"
                >
                  Criar uma agora
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <SharedFooter />
    </div>
  )
}
