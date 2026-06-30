import { useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../constants'
import { SharedFooter } from '../components/SharedFooter'

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    <>
      <header className="bg-surface border-b border-outline-variant z-50 sticky top-0">
        <div className="flex justify-between items-center px-lg md:px-margin-desktop h-16 max-w-max-width mx-auto">
          <div className="text-lg font-h2 font-bold text-primary tracking-tight">CodeLab</div>
          <div className="flex items-center gap-md">
            <a className="text-body-md font-body-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="/">
              Entrar
            </a>
            <a className="btn-secondary !h-9 !px-md" href="mailto:suporte@codelab.com">
              Contate-nos
            </a>
          </div>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center py-xl px-margin-mobile">
        <div className="w-full max-w-[480px] bg-surface-container rounded-xl border border-outline-variant tinted-shadow overflow-hidden">
          <div className="p-lg md:p-xl space-y-lg">
            <div className="text-center space-y-xs">
              <h1 className="text-h1 font-h1 font-bold text-on-surface">Começar agora</h1>
              <p className="text-body-md font-body-md text-on-surface-variant">Crie sua conta no CodeLab e domine a lógica</p>
            </div>
            <form className="space-y-md" onSubmit={handleSubmit}>
              <div>
                <label className="form-label" htmlFor="name">
                  Nome Completo
                </label>
                <input
                  className="input-field"
                  id="name"
                  placeholder="Ex: João Silva"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="register-email">
                  E-mail
                </label>
                <input
                  className="input-field"
                  id="register-email"
                  placeholder="nome@email.com"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="form-label" htmlFor="register-password">
                    Senha
                  </label>
                  <input
                    className="input-field"
                    id="register-password"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="confirm-password">
                    Confirmar Senha
                  </label>
                  <input
                    className="input-field"
                    id="confirm-password"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-start gap-sm pt-xs">
                <div className="flex items-center h-5">
                  <input
                    className="w-4 h-4 text-primary bg-surface-container-highest border-outline-variant rounded focus:ring-primary focus:ring-offset-surface-container accent-primary"
                    id="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(event) => setAcceptTerms(event.target.checked)}
                  />
                </div>
                <label className="text-body-sm font-body-sm text-on-surface-variant" htmlFor="terms">
                  Eu aceito os <span className="text-primary font-semibold">termos de serviço</span> e a{' '}
                  <span className="text-primary font-semibold">política de privacidade</span> do CodeLab.
                </label>
              </div>
              {error ? <p className="text-error text-body-sm font-semibold" role="alert">{error}</p> : null}
              <button className="btn-primary w-full mt-md" type="submit" disabled={submitting}>
                {submitting ? 'Criando conta...' : 'Criar Conta'}
              </button>
            </form>
            <div className="relative py-md">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-label">
                <span className="bg-surface-container px-md text-on-surface-variant font-medium">Ou registre-se com</span>
              </div>
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
            <div className="pt-lg text-center border-t border-outline-variant">
              <p className="text-body-sm text-on-surface-variant">
                Já possui uma conta?
                <a className="text-primary font-semibold hover:underline transition-all ml-xs" href="/">
                  Fazer Login
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
