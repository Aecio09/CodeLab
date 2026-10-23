import { useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../constants'
import { AuthBackground } from '../components/AuthBackground'

const fieldWrapperClass =
  'relative flex items-center rounded bg-[#0a0a0c] border border-white/10 hover:border-white/20 focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 transition-all'

const inputClass =
  'w-full min-h-11 bg-transparent border-0 py-2.5 pl-2.5 pr-3.5 text-sm text-white placeholder:text-neutral-500 focus:ring-0 focus:outline-none'

const labelClass = 'block text-xs font-medium text-neutral-300 mb-1.5'

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
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#070709] text-auth-on-surface antialiased font-auth-body selection:bg-white selection:text-black">
      <AuthBackground />

      <header className="relative z-20 w-full border-b border-white/[0.06] bg-[#070709]/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6 lg:px-12">
          <a className="flex items-center gap-2.5" href="/" aria-label="CodeLab — página inicial">
            <span className="w-7 h-7 rounded bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                terminal
              </span>
            </span>
            <span className="text-base font-semibold text-white tracking-tight">CodeLab</span>
          </a>

          <a
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded border border-white/10 bg-white/[0.05] px-4 text-xs font-medium text-white transition-colors hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            href="/"
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">login</span>
            Entrar
          </a>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 justify-center px-4 sm:px-6 py-10 sm:py-12">
        <div className="my-auto w-full max-w-[480px]">
          <div className="bg-[#121215]/95 backdrop-blur-md border border-white/[0.08] rounded-lg p-7 sm:p-9 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-lg bg-gradient-to-r from-violet-500 via-cyan-400 to-sky-300 opacity-60"></div>

            <div className="mb-7 text-left">
              <h1
                className="text-3xl leading-tight text-white font-normal"
                style={{ fontFamily: 'Times New Roman, Times, serif', letterSpacing: '-0.01em' }}
              >
                Crie sua conta
              </h1>
              <p className="text-sm text-neutral-400 mt-2">
                Comece sua jornada na programação. Aprenda lógica na prática.
              </p>
            </div>

            {error ? (
              <div
                className="mb-4 flex items-start gap-2 rounded border border-auth-error/30 bg-auth-error-container/20 px-3 py-2 text-sm text-auth-error"
                role="alert"
              >
                <span className="material-symbols-outlined text-[17px] mt-px" aria-hidden="true">error</span>
                <span>{error}</span>
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className={labelClass} htmlFor="name">
                  Nome completo
                </label>
                <div className={fieldWrapperClass}>
                  <span className="pl-3.5 text-cyan-400/80 flex items-center justify-center pointer-events-none" aria-hidden="true">
                    <span className="material-symbols-outlined text-[17px]">person</span>
                  </span>
                  <input
                    autoComplete="name"
                    className={inputClass}
                    id="name"
                    name="name"
                    placeholder="Seu nome"
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="register-email">
                  E-mail
                </label>
                <div className={fieldWrapperClass}>
                  <span className="pl-3.5 text-cyan-400/80 flex items-center justify-center pointer-events-none" aria-hidden="true">
                    <span className="material-symbols-outlined text-[17px]">alternate_email</span>
                  </span>
                  <input
                    autoComplete="email"
                    className={inputClass}
                    id="register-email"
                    name="email"
                    placeholder="seu@email.com"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="register-password">
                  Senha
                </label>
                <div className={fieldWrapperClass}>
                  <span className="pl-3.5 text-violet-400/80 flex items-center justify-center pointer-events-none" aria-hidden="true">
                    <span className="material-symbols-outlined text-[17px]">key</span>
                  </span>
                  <input
                    autoComplete="new-password"
                    className={`${inputClass} pr-10 font-mono tracking-widest`}
                    id="register-password"
                    name="password"
                    placeholder="••••••••••••"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    className="absolute right-0 pr-3.5 text-neutral-400 hover:text-white transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="confirm-password">
                  Confirmar senha
                </label>
                <div className={fieldWrapperClass}>
                  <span className="pl-3.5 text-violet-400/80 flex items-center justify-center pointer-events-none" aria-hidden="true">
                    <span className="material-symbols-outlined text-[17px]">lock</span>
                  </span>
                  <input
                    autoComplete="new-password"
                    className={`${inputClass} pr-10 font-mono tracking-widest`}
                    id="confirm-password"
                    name="confirmPassword"
                    placeholder="••••••••••••"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                    aria-pressed={showConfirmPassword}
                    className="absolute right-0 pr-3.5 text-neutral-400 hover:text-white transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border border-white/20 bg-[#0a0a0c] text-white accent-white focus:ring-2 focus:ring-white/30 focus:ring-offset-0"
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                />
                <label className="text-xs leading-relaxed text-neutral-400" htmlFor="terms">
                  Eu aceito os <span className="font-medium text-neutral-200">termos de serviço</span> e a{' '}
                  <span className="font-medium text-neutral-200">política de privacidade</span> do CodeLab.
                </label>
              </div>

              <div className="pt-2">
                <button
                  className="w-full min-h-11 bg-white hover:bg-neutral-200 text-neutral-950 text-sm font-semibold py-2.5 px-4 rounded flex items-center justify-center gap-2 transition-all duration-150 shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121215]"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin" aria-hidden="true">
                        progress_activity
                      </span>
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar conta
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]"></div>
              </div>
              <span className="relative bg-[#121215] px-3 text-[11px] font-mono text-neutral-400 tracking-wider">
                ou registre-se com
              </span>
            </div>

            <a
              className="w-full min-h-11 bg-[#18181c] hover:bg-[#202025] border border-white/10 hover:border-white/20 text-neutral-200 text-sm font-medium py-2.5 px-4 rounded flex items-center justify-center gap-2.5 transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121215]"
              href={`${API_BASE_URL}/oauth2/authorization/google`}
            >
              <svg aria-hidden="true" className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Registrar com o Google</span>
            </a>

            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-neutral-400">
              Aprenda no seu ritmo
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-neutral-400">
              Já possui uma conta?
              <a className="text-white hover:underline font-medium ml-1 transition-colors" href="/">
                Entrar
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-20 w-full border-t border-white/[0.06] bg-[#070709]/40 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-3 px-6 py-5 md:flex-row lg:px-12">
          <div className="text-xs text-neutral-400">
            © {new Date().getFullYear()} CodeLab. Todos os direitos reservados.
          </div>
          <a className="text-xs text-neutral-400 hover:text-white transition-colors" href="/">
            Entrar
          </a>
        </div>
      </footer>
    </div>
  )
}
