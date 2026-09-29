import { useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../constants'
import { SharedFooter } from '../components/SharedFooter'

const BENEFICIOS = [
  {
    icon: 'terminal',
    title: 'Playground integrado',
    description: 'Escreva e execute código no navegador, sem instalar nada.',
  },
  {
    icon: 'rate_review',
    title: 'Revisão automática',
    description: 'Toda resposta passa por uma correção que aponta o que ajustar.',
  },
]

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (!acceptTerms) {
      setError('Você precisa aceitar os termos para continuar.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      if (!response.ok) {
        setError('Não foi possível criar a conta agora.')
        return
      }

      window.location.href = '/?registered=1'
    } catch {
      setError('Não foi possível conectar ao servidor.')
    } finally {
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
            href="/"
            className="border border-outline-variant px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition-colors duration-150 hover:border-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Entrar
          </a>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-6 py-12 lg:grid-cols-12 lg:gap-12">
        <div className="order-2 flex flex-col justify-center gap-6 lg:order-1 lg:col-span-5 lg:pr-6">
          <div className="inline-flex w-fit items-center border border-outline-variant bg-surface-container-low px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-widest text-on-surface-variant">
            Aprendizado prático
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-normal leading-none tracking-tight text-primary md:text-5xl">
              Seu primeiro passo para o aprendizado de tecnologia.
            </h1>
            <p className="pt-2 text-lg leading-relaxed text-on-surface-variant">
              Crie sua conta para acessar as trilhas guiadas, o playground e a revisão automática das suas
              respostas.
            </p>
          </div>

          <div className="space-y-4 border-t border-outline-variant pt-6">
            {BENEFICIOS.map((item) => (
              <div key={item.title} className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-lg text-primary" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-primary">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 flex w-full flex-col items-center lg:order-2 lg:col-span-7">
          <div className="w-full max-w-xl border border-outline-variant bg-surface-container-low p-6 shadow-2xl md:p-10">
            <div className="mb-8 space-y-1">
              <h2 className="font-serif text-3xl font-normal tracking-tight text-primary">Crie sua conta</h2>
              <p className="text-sm text-on-surface-variant">
                Leva menos de um minuto e não pede conhecimento prévio.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="name">
                  Nome completo
                </label>
                <input
                  className="input-field"
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ex: João Silva"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="form-label" htmlFor="register-email">
                  Email
                </label>
                <input
                  className="input-field"
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="form-label" htmlFor="register-password">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      className="input-field pr-10"
                      id="register-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
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

                <div className="space-y-1.5">
                  <label className="form-label" htmlFor="confirm-password">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <input
                      className="input-field pr-10"
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-outline transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                      aria-pressed={showConfirmPassword}
                    >
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    className="mt-0.5 h-4 w-4 shrink-0 rounded-none border-outline-variant bg-background text-on-primary checked:border-on-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0"
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(event) => setAcceptTerms(event.target.checked)}
                  />
                  <span className="text-sm leading-relaxed text-on-surface-variant">
                    Aceito os <span className="font-semibold text-primary">termos de serviço</span> e a{' '}
                    <span className="font-semibold text-primary">política de privacidade</span> do CodeLab.
                  </span>
                </label>
              </div>

              {error && (
                <p className="flex items-start gap-2 border border-error bg-error-container px-3 py-2.5 text-xs text-on-error-container" role="alert">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
                  <span>{error}</span>
                </p>
              )}

              <button
                className="btn-primary group mt-2 w-full py-3"
                type="submit"
                disabled={submitting}
              >
                <span>{submitting ? 'Criando conta...' : 'Criar conta'}</span>
                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  arrow_forward
                </span>
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

            <div className="mt-6 border-t border-outline-variant pt-6 text-center">
              <p className="text-sm text-on-surface-variant">
                Já tem uma conta?
                <a
                  className="ml-1 font-semibold text-primary underline-offset-4 hover:underline"
                  href="/"
                >
                  Entrar
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <SharedFooter />
    </div>
  )
}
