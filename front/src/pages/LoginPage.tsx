import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../constants'
import { SharedFooter } from '../components/SharedFooter'

type LoginPageProps = {
  registered: boolean
}

export function LoginPage({ registered }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/me`, { credentials: 'include' })
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = `${API_BASE_URL}/login`
    form.style.display = 'none'

    const usernameInput = document.createElement('input')
    usernameInput.name = 'username'
    usernameInput.value = email
    form.appendChild(usernameInput)

    const passwordInput = document.createElement('input')
    passwordInput.name = 'password'
    passwordInput.value = password
    form.appendChild(passwordInput)

    document.body.appendChild(form)
    form.submit()
  }

  return (
    <>
      <main className="flex-grow flex items-center justify-center px-md md:px-lg py-xl">
        <div className="w-full max-w-[440px]">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg md:p-xl shadow-xl">
            <div className="flex flex-col items-center text-center mb-xl">
              <div className="mb-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  terminal
                </span>
                <span className="text-lg font-h2 font-bold text-primary tracking-tight">CodeLab</span>
              </div>
              <h1 className="font-h2 text-h2 text-on-surface mb-xs">Bem-vindo de volta</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Aprenda lógica de programação como em um jogo</p>
            </div>

            {registered ? <p className="text-primary text-body-sm mb-md" aria-live="polite">Cadastro realizado. Faça login para continuar.</p> : null}

            <form className="space-y-lg" onSubmit={handleSubmit}>
              <div>
<label className="form-label" htmlFor="email">
                   Email
                </label>
                <input
                  className="input-field"
                  id="email"
                  placeholder="seu@email.com"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-xs">
                  <label className="form-label !mb-0" htmlFor="password">
                    Senha
                  </label>
                  <span className="font-label text-label text-primary opacity-60">
                    Esqueci minha senha
                  </span>
                </div>
                <input
                  className="input-field"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <button
                className="btn-primary w-full"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Entrando...' : 'Entrar na conta'}
              </button>
            </form>

            <div className="relative my-xl flex items-center">
              <div className="flex-grow border-t border-outline-variant"></div>
              <span className="flex-shrink mx-md font-label text-label text-on-surface-variant tracking-widest">ou entre com</span>
              <div className="flex-grow border-t border-outline-variant"></div>
            </div>

            <div className="grid grid-cols-1">
              <a
                className="btn-secondary w-full"
                href={`${API_BASE_URL}/oauth2/authorization/google`}
              >
                <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.35 1.22 8.33 3.22l6.2-6.2C34.68 2.82 29.74 1 24 1 14.82 1 6.73 6.98 3.36 15.36l7.48 5.8C12.67 14.37 17.91 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.43-4.74H24v9h12.66c-.55 2.96-2.2 5.47-4.7 7.16l7.27 5.66C43.97 37.18 46.5 31.41 46.5 24.5z" />
                  <path fill="#FBBC05" d="M10.84 28.16A14.5 14.5 0 019.5 24c0-1.45.25-2.85.7-4.16l-7.48-5.8A23.97 23.97 0 001.5 24c0 3.77.9 7.34 2.72 10.53l7.62-6.37z" />
                  <path fill="#34A853" d="M24 47c6.48 0 11.92-2.14 15.9-5.82l-7.27-5.66c-2.02 1.36-4.6 2.17-8.63 2.17-6.08 0-11.32-4.87-13.16-11.66l-7.62 6.37C6.73 41.02 14.82 47 24 47z" />
                </svg>
                Google
              </a>
            </div>

            <div className="mt-xl pt-lg border-t border-outline-variant text-center">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Não tem uma conta?
                <a className="font-label text-label text-primary hover:underline ml-xs uppercase" href="/register">
                  Crie uma agora
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <SharedFooter />
    </>
  )
}
