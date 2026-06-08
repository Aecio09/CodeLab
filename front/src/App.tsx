import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useActiveCode,
} from '@codesandbox/sandpack-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type LoginPageProps = {
  registered: boolean
}

type UserProfile = {
  id: number
  name: string
  email: string
  photo: string | null
  role: string
}

type QuestionItem = {
  id: number
  questionBody: string
  type: 'MULTIPLE_CHOICE' | 'PRACTICAL'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  requiredUsage: string | null
  topic:
    | 'OPERADORES_TIPOS_E_VARIAVEIS'
    | 'EXECUCAO_CONDICIONAL'
    | 'OPERADORES_LOGICOS'
    | 'LACOS'
    | 'SUBPROGRAMAS'
    | 'VETORES'
    | 'ARRAYS'
    | 'TIPOS_CRIADOS_PELO_PROGRAMADOR'
}

type QuestionPayload = {
  questionBody: string
  type: QuestionItem['type']
  difficulty: QuestionItem['difficulty']
  requiredUsage: string | null
  topic: QuestionItem['topic']
}

type QuestionSeedImportResponse = {
  sourceFile: string
  extractedQuestions: number
  insertedQuestions: number
  seedQuestionsTotal: number
}

type AnswerReviewResponse = {
  id: number
  answerBody: string
  verificationStatus: string
  nodeVerificationResult: string | null
  aiVerificationResult: string | null
}

type ReviewApiError = {
  code: string
  message: string
  status: number
}

const DEFAULT_PLAYGROUND_CODE = `function solve(input: unknown): unknown {
  return input
}

console.log(solve('teste'))
`

function PlaygroundCodeEditor({
  loading,
  onCodeChange,
}: {
  loading: boolean
  onCodeChange: (value: string) => void
}) {
  const { code } = useActiveCode()

  useEffect(() => {
    onCodeChange(code)
  }, [code, onCodeChange])

  return (
    <SandpackCodeEditor
      showLineNumbers
      showInlineErrors
      wrapContent={false}
      style={{ minHeight: 440 }}
      readOnly={loading}
    />
  )
}

const TOPIC_OPTIONS: Array<QuestionItem['topic']> = [
  'OPERADORES_TIPOS_E_VARIAVEIS',
  'EXECUCAO_CONDICIONAL',
  'OPERADORES_LOGICOS',
  'LACOS',
  'SUBPROGRAMAS',
  'VETORES',
  'ARRAYS',
  'TIPOS_CRIADOS_PELO_PROGRAMADOR',
]

const TYPE_OPTIONS: Array<QuestionItem['type']> = ['MULTIPLE_CHOICE', 'PRACTICAL']
const DIFFICULTY_OPTIONS: Array<QuestionItem['difficulty']> = ['EASY', 'MEDIUM', 'HARD']

function topicLabel(topic: QuestionItem['topic']) {
  return topic.replaceAll('_', ' ')
}

function difficultyLabel(difficulty: QuestionItem['difficulty']) {
  if (difficulty === 'EASY') return 'Fácil'
  if (difficulty === 'MEDIUM') return 'Médio'
  return 'Difícil'
}

function typeLabel(type: QuestionItem['type']) {
  return type === 'PRACTICAL' ? 'Prática' : 'Múltipla escolha'
}

function resolvePhotoUrl(photo: string | null) {
  if (!photo) return 'https://via.placeholder.com/160x160?text=User'
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo
  if (photo.startsWith('/')) return `${API_BASE_URL}${photo}`
  return `${API_BASE_URL}/${photo}`
}

function BackgroundDecor() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-secondary-container/10 rounded-full blur-[100px]"></div>
    </div>
  )
}

function SharedFooter() {
  return (
    <footer className="bg-surface-container-low w-full py-xl border-t border-outline-variant mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-lg md:px-margin-desktop max-w-max-width mx-auto gap-md">
        <div className="text-h3 font-semibold text-on-surface">CodeLab</div>
        <div className="flex flex-wrap justify-center gap-md">
          <a className="text-label text-on-surface-variant hover:text-primary underline transition-all" href="#">
            Política de Privacidade
          </a>
          <a className="text-label text-on-surface-variant hover:text-primary underline transition-all" href="#">
            Termos de Serviço
          </a>
          <a className="text-label text-on-surface-variant hover:text-primary underline transition-all" href="#">
            Configurações de Cookies
          </a>
          <a className="text-label text-on-surface-variant hover:text-primary underline transition-all" href="#">
            Segurança
          </a>
        </div>
        <div className="text-label text-on-surface-variant">© 2024 CodeLab. Todos os direitos reservados.</div>
      </div>
    </footer>
  )
}

function LoginPage({ registered }: LoginPageProps) {
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
        .catch(() => {
        })
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
                <span className="font-h1 text-h1 text-primary tracking-tight">CodeLab</span>
              </div>
              <h1 className="font-h2 text-h2 text-on-surface mb-xs">Bem-vindo de volta</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Aprenda lógica de programação como em um jogo</p>
            </div>

            {registered ? <p className="text-primary text-body-sm mb-md">Cadastro realizado. Faça login para continuar.</p> : null}

            <form className="space-y-lg" onSubmit={handleSubmit}>
              <div className="space-y-xs">
                <label className="block font-label text-label text-on-surface-variant px-xs uppercase" htmlFor="email">
                  E-mail
                </label>
                <input
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg font-body-md text-on-surface placeholder:text-outline"
                  id="email"
                  placeholder="seu@email.com"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-xs">
                <div className="flex justify-between items-center px-xs">
                  <label className="font-label text-label text-on-surface-variant uppercase" htmlFor="password">
                    Senha
                  </label>
                  <a className="font-label text-label text-primary hover:underline transition-all" href="#">
                    Esqueci minha senha
                  </a>
                </div>
                <input
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg font-body-md text-on-surface placeholder:text-outline"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <button
                className="w-full h-12 bg-primary text-on-primary font-label text-label uppercase rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-70"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Entrando...' : 'Entrar na conta'}
              </button>
            </form>

            <div className="relative my-xl flex items-center">
              <div className="flex-grow border-t border-outline-variant"></div>
              <span className="flex-shrink mx-md font-label text-label text-on-surface-variant uppercase tracking-widest">ou entre com</span>
              <div className="flex-grow border-t border-outline-variant"></div>
            </div>

            <div className="grid grid-cols-1">
              <a
                className="flex items-center justify-center gap-sm h-12 bg-surface-container-high border border-outline-variant rounded-lg font-label text-label text-on-surface-variant hover:bg-surface-container-highest transition-all uppercase"
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

function RegisterPage() {
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
          <div className="text-h2 font-bold text-primary">CodeLab</div>
          <div className="flex items-center gap-md">
            <a className="text-body-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="/">
              Entrar
            </a>
            <a className="bg-primary-container text-on-primary-container px-md py-sm rounded-lg font-label hover:brightness-110 transition-all cursor-pointer" href="mailto:suporte@codelab.com">
              Contate-nos
            </a>
          </div>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center py-xl px-margin-mobile">
        <div className="w-full max-w-[480px] bg-surface-container rounded-xl border border-outline-variant tinted-shadow overflow-hidden">
          <div className="p-lg md:p-xl space-y-lg">
            <div className="text-center space-y-xs">
              <h1 className="text-h1 text-on-surface">Começar agora</h1>
              <p className="text-body-md text-on-surface-variant">Crie sua conta no CodeLab e domine a lógica</p>
            </div>
            <form className="space-y-md" onSubmit={handleSubmit}>
              <div className="space-y-xs">
                <label className="text-label text-on-surface-variant block uppercase tracking-wider" htmlFor="name">
                  Nome Completo
                </label>
                <input
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline"
                  id="name"
                  placeholder="Ex: João Silva"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-xs">
                <label className="text-label text-on-surface-variant block uppercase tracking-wider" htmlFor="register-email">
                  E-mail
                </label>
                <input
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline"
                  id="register-email"
                  placeholder="nome@email.com"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <label className="text-label text-on-surface-variant block uppercase tracking-wider" htmlFor="register-password">
                    Senha
                  </label>
                  <input
                    className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline"
                    id="register-password"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div className="space-y-xs">
                  <label className="text-label text-on-surface-variant block uppercase tracking-wider" htmlFor="confirm-password">
                    Confirmar Senha
                  </label>
                  <input
                    className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline"
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
                    className="w-4 h-4 text-primary bg-surface-container-highest border-outline-variant rounded focus:ring-primary focus:ring-offset-surface-container"
                    id="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(event) => setAcceptTerms(event.target.checked)}
                  />
                </div>
                <label className="text-body-sm text-on-surface-variant" htmlFor="terms">
                  Eu aceito os <a className="text-primary hover:underline font-semibold" href="#">termos de serviço</a> e a{' '}
                  <a className="text-primary hover:underline font-semibold" href="#">política de privacidade</a> do CodeLab.
                </label>
              </div>
              {error ? <p className="text-error text-body-sm">{error}</p> : null}
              <button className="w-full h-12 bg-primary text-on-primary font-h3 text-center rounded-lg hover:brightness-110 transition-all active:scale-[0.98] mt-md disabled:opacity-70" type="submit" disabled={submitting}>
                {submitting ? 'Criando conta...' : 'Criar Conta'}
              </button>
            </form>
            <div className="relative py-md">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-label uppercase">
                <span className="bg-surface-container px-md text-on-surface-variant font-medium">Ou registre-se com</span>
              </div>
            </div>
            <div className="grid grid-cols-1">
              <a
                className="flex items-center justify-center gap-sm h-11 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors text-label text-on-surface uppercase tracking-widest"
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

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('invalid-session')
        }

        const data = (await response.json()) as UserProfile
        if (cancelled) return

        if (data.role === 'ADMIN') {
          setRedirecting(true)
          window.location.href = '/admin/questions'
          return
        }

        setProfile(data)
        setName(data.name)
        setEmail(data.email)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof Error && err.message === 'invalid-session') {
          setError('Sessão inválida. Faça login novamente.')
        } else {
          setError('Não foi possível carregar seu perfil.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/perfil`, {
        method: 'PUT',
        credentials: 'include',
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
        setError('Não foi possível salvar as alterações.')
        return
      }

      const updated = (await response.json()) as UserProfile
      setProfile(updated)
      setName(updated.name)
      setEmail(updated.email)
      setPassword('')
      setSuccess('Perfil atualizado com sucesso.')
    } catch {
      setError('Não foi possível conectar ao servidor.')
    }
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoFile(event.target.files?.[0] ?? null)
  }

  const handleUploadPhoto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!photoFile) {
      setError('Selecione uma imagem antes de enviar.')
      return
    }

    const formData = new FormData()
    formData.append('photo', photoFile)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/upload-photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        setError('Não foi possível atualizar a foto.')
        return
      }

      const photoPath = await response.text()
      setProfile((prev) => (prev ? { ...prev, photo: photoPath } : prev))
      setPhotoFile(null)
      setSuccess('Foto atualizada com sucesso.')
    } catch {
      setError('Não foi possível conectar ao servidor.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Tem certeza que deseja deletar sua conta?')) return

    setError('')
    setSuccess('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/perfil`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        setError('Não foi possível deletar sua conta.')
        return
      }

      window.location.href = '/'
    } catch {
      setError('Não foi possível conectar ao servidor.')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error("Erro ao deslogar no servidor:", err);
    } finally {
      window.location.href = '/';
    }
  };

  if (redirecting) {
    return <main className="flex-grow flex items-center justify-center text-on-surface-variant">Redirecionando para o painel admin...</main>
  }

  return (
    <>
      <header className="bg-surface border-b border-outline-variant z-50 sticky top-0">
        <div className="flex justify-between items-center px-lg md:px-margin-desktop h-16 max-w-max-width mx-auto">
          <div className="text-h2 font-bold text-primary">CodeLab</div>
          <div className="flex items-center gap-md">
            <span className="text-body-sm text-on-surface-variant uppercase">{profile?.role ?? 'USER'}</span>
            <button
              type="button"
              className="bg-primary-container text-on-primary-container px-md py-sm rounded-lg font-label hover:brightness-110 transition-all"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-xl px-margin-mobile">
        <div className="w-full max-w-[560px] bg-surface-container rounded-xl border border-outline-variant tinted-shadow overflow-hidden">
          <div className="p-lg md:p-xl space-y-lg">
            <div className="text-center space-y-sm">
              <img
                src={resolvePhotoUrl(profile?.photo ?? null)}
                alt="Foto de perfil"
                className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-surface-container-highest"
              />
              <h1 className="text-h1 text-on-surface">Meu perfil</h1>
              <p className="text-body-sm text-on-surface-variant">Gerencie seus dados e mantenha sua conta atualizada.</p>
            </div>

            {loading ? <p className="text-body-sm text-on-surface-variant">Carregando perfil...</p> : null}
            {error ? <p className="text-error text-body-sm">{error}</p> : null}
            {success ? <p className="text-primary text-body-sm">{success}</p> : null}

            <form className="space-y-md" onSubmit={handleUpdateProfile}>
              <div className="space-y-xs">
                <label className="text-label text-on-surface-variant block uppercase tracking-wider" htmlFor="profile-name">
                  Nome
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-xs">
                <label className="text-label text-on-surface-variant block uppercase tracking-wider" htmlFor="profile-email">
                  E-mail
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-xs">
                <label className="text-label text-on-surface-variant block uppercase tracking-wider" htmlFor="profile-password">
                  Nova senha
                </label>
                <input
                  id="profile-password"
                  type="password"
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline"
                  value={password}
                  placeholder="Opcional"
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                className="w-full h-12 bg-primary text-on-primary font-label text-label uppercase rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                Salvar alterações
              </button>
            </form>

            <form className="space-y-md" onSubmit={handleUploadPhoto}>
              <div className="space-y-xs">
                <label className="text-label text-on-surface-variant block uppercase tracking-wider" htmlFor="profile-photo">
                  Foto de perfil
                </label>
                <input
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  className="w-full text-body-sm text-on-surface file:mr-sm file:py-sm file:px-md file:rounded-lg file:border-0 file:bg-surface-container-highest file:text-on-surface file:cursor-pointer"
                  onChange={handlePhotoChange}
                  disabled={loading}
                />
              </div>
              <button
                className="w-full h-12 bg-secondary-container text-on-secondary-container font-label text-label uppercase rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                Atualizar foto
              </button>
            </form>

            <div className="pt-md border-t border-outline-variant space-y-sm">
              <button
                type="button"
                className="w-full h-12 bg-error-container text-on-error-container font-label text-label uppercase rounded-lg hover:brightness-110 transition-all"
                onClick={handleDeleteAccount}
              >
                Deletar conta
              </button>
            </div>
          </div>
        </div>
      </main>

      <SharedFooter />
    </>
  )
}

function AdminQuestionsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState<'ALL' | QuestionItem['topic']>('ALL')
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | QuestionItem['difficulty']>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | QuestionItem['type']>('ALL')
  const [form, setForm] = useState<QuestionPayload>({
    questionBody: '',
    type: 'PRACTICAL',
    difficulty: 'EASY',
    requiredUsage: null,
    topic: 'LACOS',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const editFormRef = useRef<HTMLDivElement | null>(null)

  const loadQuestions = async () => {
    const questionsResponse = await fetch(`${API_BASE_URL}/questions`, {
      credentials: 'include',
    })

    if (!questionsResponse.ok) {
      throw new Error('load-questions')
    }

    const data = (await questionsResponse.json()) as QuestionItem[]
    setQuestions(data)
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const meResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
          credentials: 'include',
        })

        if (!meResponse.ok) {
          window.location.href = '/'
          return
        }

        const me = (await meResponse.json()) as UserProfile
        if (cancelled) return
        setProfile(me)

        if (me.role !== 'ADMIN') {
          window.location.href = '/perfil'
          return
        }

        await loadQuestions()
        if (cancelled) return
      } catch {
        if (!cancelled) setError('Não foi possível carregar as questões.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch =
        search.trim() === '' ||
        question.questionBody.toLowerCase().includes(search.toLowerCase()) ||
        question.topic.toLowerCase().includes(search.toLowerCase())
      const matchesTopic = topicFilter === 'ALL' || question.topic === topicFilter
      const matchesDifficulty = difficultyFilter === 'ALL' || question.difficulty === difficultyFilter
      const matchesType = typeFilter === 'ALL' || question.type === typeFilter
      return matchesSearch && matchesTopic && matchesDifficulty && matchesType
    })
  }, [difficultyFilter, questions, search, topicFilter, typeFilter])

  const avgDifficulty = useMemo(() => {
    if (questions.length === 0) return '-'
    const score = questions.reduce((acc, question) => {
      if (question.difficulty === 'EASY') return acc + 1
      if (question.difficulty === 'MEDIUM') return acc + 2
      return acc + 3
    }, 0)
    const avg = score / questions.length
    if (avg < 1.7) return 'Fácil'
    if (avg < 2.4) return 'Médio'
    return 'Difícil'
  }, [questions])

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error("Erro ao deslogar no servidor:", err);
    } finally {
      window.location.href = '/';
    }
  };

  const handleEdit = (question: QuestionItem) => {
    setSelectedQuestion(question)
    setForm({
      questionBody: question.questionBody,
      type: question.type,
      difficulty: question.difficulty,
      requiredUsage: question.requiredUsage,
      topic: question.topic,
    })
    setSuccess('')
    setError('')
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const handleNewQuestion = () => {
    setSelectedQuestion(null)
    setForm({
      questionBody: '',
      type: 'PRACTICAL',
      difficulty: 'EASY',
      requiredUsage: null,
      topic: 'LACOS',
    })
    setSuccess('')
    setError('')
  }

  const handleUploadQuestionsClick = () => {
    uploadInputRef.current?.click()
  }

  const handleUploadQuestionsFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/questions/import-upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        setError('Não foi possível importar o arquivo de questões.')
        return
      }

      const result = (await response.json()) as QuestionSeedImportResponse
      await loadQuestions()
      setSuccess(
        `Importação concluída: ${result.extractedQuestions} extraídas, ${result.insertedQuestions} inseridas (seed total: ${result.seedQuestionsTotal}).`,
      )
    } catch {
      setError('Não foi possível conectar ao servidor para importar questões.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleSaveQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload: QuestionPayload = {
      questionBody: form.questionBody,
      type: form.type,
      difficulty: form.difficulty,
      topic: form.topic,
      requiredUsage: form.requiredUsage && form.requiredUsage.trim() ? form.requiredUsage.trim().toUpperCase() : null,
    }

    try {
      const url = selectedQuestion ? `${API_BASE_URL}/questions/${selectedQuestion.id}` : `${API_BASE_URL}/questions`
      const method = selectedQuestion ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        setError('Não foi possível salvar a questão.')
        setSaving(false)
        return
      }

      const savedQuestion = (await response.json()) as QuestionItem
      if (selectedQuestion) {
        setQuestions((prev) => prev.map((item) => (item.id === savedQuestion.id ? savedQuestion : item)))
      } else {
        setQuestions((prev) => [savedQuestion, ...prev])
      }

      setSelectedQuestion(savedQuestion)
      setSuccess(selectedQuestion ? 'Questão atualizada com sucesso.' : 'Questão criada com sucesso.')
    } catch {
      setError('Não foi possível conectar ao servidor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <aside className="fixed left-0 top-0 h-full flex flex-col py-lg px-md border-r border-outline-variant bg-surface-container-low w-64 z-40">
        <div className="flex items-center gap-md px-md mb-xl">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined">terminal</span>
          </div>
          <div>
            <h1 className="font-h3 text-h3 font-bold text-primary">CodeLab Admin</h1>
            <p className="font-label text-label text-on-surface-variant">Management Portal</p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-xs">
          <a className="flex items-center gap-md text-on-surface-variant hover:text-on-surface px-md py-sm hover:bg-surface-container-highest rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label text-label">Dashboard</span>
          </a>
          <a className="flex items-center gap-md bg-secondary-container text-on-secondary-container rounded-lg px-md py-sm scale-[0.98] transition-all" href="/admin/questions">
            <span className="material-symbols-outlined">terminal</span>
            <span className="font-label text-label">Questions</span>
          </a>
        </nav>
        <div className="mt-auto px-md space-y-sm">
          <input
            ref={uploadInputRef}
            type="file"
            accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleUploadQuestionsFile}
          />
          <button
            type="button"
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-label text-label px-md py-sm rounded-lg flex items-center justify-center gap-sm transition-colors duration-200"
            onClick={handleUploadQuestionsClick}
            disabled={uploading || loading}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {uploading ? 'Uploading...' : 'Upload Questions'}
          </button>
          <button
            type="button"
            className="w-full border border-outline-variant hover:bg-surface-container-highest text-on-surface font-label text-label px-md py-sm rounded-lg transition-colors duration-200"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="ml-64 flex flex-col min-h-screen">
        <header className="flex justify-between items-center h-16 px-gutter w-full sticky top-0 z-30 bg-surface border-b border-outline-variant">
          <h2 className="font-h2 text-h2 font-bold text-primary">Questions Manager</h2>
          <div className="flex items-center gap-md">
            <div className="text-right">
              <p className="text-body-sm text-on-surface">{profile?.name ?? 'Administrador'}</p>
              <p className="text-label text-on-surface-variant">{profile?.email ?? ''}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant">
              <img alt="Admin profile" className="w-full h-full object-cover" src={resolvePhotoUrl(profile?.photo ?? null)} />
            </div>
          </div>
        </header>

        <div className="p-gutter flex flex-col gap-lg max-w-container-max mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
            <div className="bg-surface-container border border-outline-variant p-lg rounded-xl flex flex-col gap-xs">
              <span className="font-label text-label text-on-surface-variant">Total Questions</span>
              <span className="font-h1 text-h1 text-primary">{questions.length}</span>
            </div>
            <div className="bg-surface-container border border-outline-variant p-lg rounded-xl flex flex-col gap-xs">
              <span className="font-label text-label text-on-surface-variant">Filtradas</span>
              <span className="font-h1 text-h1 text-primary">{filteredQuestions.length}</span>
            </div>
            <div className="bg-surface-container border border-outline-variant p-lg rounded-xl flex flex-col gap-xs">
              <span className="font-label text-label text-on-surface-variant">Avg. Difficulty</span>
              <span className="font-h1 text-h1 text-tertiary">{avgDifficulty}</span>
            </div>
            <div className="bg-surface-container border border-outline-variant p-lg rounded-xl flex flex-col gap-xs">
              <span className="font-label text-label text-on-surface-variant">Status</span>
              <span className="font-h1 text-h1 text-primary">{loading ? 'Carregando' : 'Online'}</span>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-lg border-b border-outline-variant flex flex-col lg:flex-row gap-md lg:items-center lg:justify-between">
              <h3 className="font-h3 text-h3 text-on-surface">Question Bank</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-sm w-full lg:w-auto">
                <input
                  className="bg-background border border-outline-variant rounded-lg px-md py-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select
                  className="bg-background border border-outline-variant rounded-lg px-md py-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  value={topicFilter}
                  onChange={(event) => setTopicFilter(event.target.value as 'ALL' | QuestionItem['topic'])}
                >
                  <option value="ALL">Todos os tópicos</option>
                  {TOPIC_OPTIONS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topicLabel(topic)}
                    </option>
                  ))}
                </select>
                <select
                  className="bg-background border border-outline-variant rounded-lg px-md py-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  value={difficultyFilter}
                  onChange={(event) => setDifficultyFilter(event.target.value as 'ALL' | QuestionItem['difficulty'])}
                >
                  <option value="ALL">Todas as dificuldades</option>
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficultyLabel(difficulty)}
                    </option>
                  ))}
                </select>
                <select
                  className="bg-background border border-outline-variant rounded-lg px-md py-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as 'ALL' | QuestionItem['type'])}
                >
                  <option value="ALL">Todos os tipos</option>
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {typeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant">
                    <th className="px-lg py-md font-label text-label text-on-surface-variant uppercase tracking-wider">ID</th>
                    <th className="px-lg py-md font-label text-label text-on-surface-variant uppercase tracking-wider">Enunciado</th>
                    <th className="px-lg py-md font-label text-label text-on-surface-variant uppercase tracking-wider">Tópico</th>
                    <th className="px-lg py-md font-label text-label text-on-surface-variant uppercase tracking-wider">Dificuldade</th>
                    <th className="px-lg py-md font-label text-label text-on-surface-variant uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filteredQuestions.map((question) => (
                    <tr
                      key={question.id}
                      className={`hover:bg-surface-container-highest transition-colors duration-150 group ${
                        selectedQuestion?.id === question.id ? 'bg-surface-container-highest' : ''
                      }`}
                    >
                      <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">#{question.id}</td>
                      <td className="px-lg py-md">
                        <div className="max-w-xl">
                          <p className="font-body-md text-body-md text-on-surface line-clamp-2">{question.questionBody}</p>
                          <p className="font-label text-label text-on-surface-variant">{typeLabel(question.type)}</p>
                        </div>
                      </td>
                      <td className="px-lg py-md">
                        <span className="bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full font-label text-[10px] uppercase">
                          {topicLabel(question.topic)}
                        </span>
                      </td>
                      <td className="px-lg py-md">
                        <span className="font-label text-label">{difficultyLabel(question.difficulty)}</span>
                      </td>
                      <td className="px-lg py-md text-right">
                        <div className="flex items-center justify-end gap-xs">
                          <button
                            type="button"
                            className="p-xs text-on-surface-variant hover:text-primary transition-colors"
                            title="Abrir playground"
                            onClick={() => {
                              window.location.href = `/admin/questions/${question.id}/playground`
                            }}
                          >
                            <span className="material-symbols-outlined">terminal</span>
                          </button>
                          <button
                            type="button"
                            className="p-xs text-on-surface-variant hover:text-primary transition-colors"
                            onClick={() => handleEdit(question)}
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredQuestions.length === 0 ? (
                    <tr>
                      <td className="px-lg py-lg text-on-surface-variant" colSpan={5}>
                        Nenhuma questão encontrada para os filtros aplicados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div ref={editFormRef} className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <h3 className="font-h3 text-h3 text-on-surface mb-md">{selectedQuestion ? `Editar Questão #${selectedQuestion.id}` : 'Nova Questão'}</h3>
            {error ? <p className="text-error text-body-sm mb-sm">{error}</p> : null}
            {success ? <p className="text-primary text-body-sm mb-sm">{success}</p> : null}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-md" onSubmit={handleSaveQuestion}>
              <div className="md:col-span-2">
                <label className="text-label text-on-surface-variant block uppercase tracking-wider mb-xs" htmlFor="questionBody">
                  Enunciado
                </label>
                <textarea
                  id="questionBody"
                  className="w-full min-h-28 px-md py-sm bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline"
                  value={form.questionBody}
                  onChange={(event) => setForm((prev) => ({ ...prev, questionBody: event.target.value }))}
                  required
                  maxLength={3000}
                />
              </div>

              <div>
                <label className="text-label text-on-surface-variant block uppercase tracking-wider mb-xs" htmlFor="type">
                  Tipo
                </label>
                <select
                  id="type"
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg"
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as QuestionItem['type'] }))}
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {typeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label text-on-surface-variant block uppercase tracking-wider mb-xs" htmlFor="difficulty">
                  Dificuldade
                </label>
                <select
                  id="difficulty"
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg"
                  value={form.difficulty}
                  onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value as QuestionItem['difficulty'] }))}
                >
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficultyLabel(difficulty)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label text-on-surface-variant block uppercase tracking-wider mb-xs" htmlFor="topic">
                  Tópico
                </label>
                <select
                  id="topic"
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg"
                  value={form.topic}
                  onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value as QuestionItem['topic'] }))}
                >
                  {TOPIC_OPTIONS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topicLabel(topic)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label text-on-surface-variant block uppercase tracking-wider mb-xs" htmlFor="requiredUsage">
                  Required Usage (opcional)
                </label>
                <input
                  id="requiredUsage"
                  className="w-full h-12 px-md bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline"
                  placeholder="ex: FOR, IF, ARRAY_MAP"
                  value={form.requiredUsage ?? ''}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      requiredUsage: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="md:col-span-2 flex gap-sm">
                <button
                  className="bg-primary text-on-primary font-label text-label px-md py-sm rounded-lg hover:bg-primary-container transition-colors disabled:opacity-70"
                  type="submit"
                  disabled={saving || loading}
                >
                  {saving ? 'Salvando...' : selectedQuestion ? 'Salvar alteração' : 'Criar questão'}
                </button>
                <button
                  className="bg-surface border border-outline-variant text-on-surface font-label text-label px-md py-sm rounded-lg hover:bg-surface-container-highest transition-colors"
                  type="button"
                  onClick={handleNewQuestion}
                >
                  {selectedQuestion ? 'Cancelar edição' : 'Limpar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}

function AdminPlaygroundPage({ questionId }: { questionId: number }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [question, setQuestion] = useState<QuestionItem | null>(null)
  const [code, setCode] = useState(DEFAULT_PLAYGROUND_CODE)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reviewResult, setReviewResult] = useState<AnswerReviewResponse | null>(null)
  const [reviewError, setReviewError] = useState<ReviewApiError | null>(null)
  const initializedQuestionCodeRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const meResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
          credentials: 'include',
        })
        if (!meResponse.ok) {
          window.location.href = '/'
          return
        }

        const me = (await meResponse.json()) as UserProfile
        if (cancelled) return
        setProfile(me)
       // if (me.role !== 'ADMIN') {
        //  window.location.href = '/perfil'
        //  return
       // }

        const questionResponse = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
          credentials: 'include',
        })
        if (!questionResponse.ok) {
          throw new Error('load-question')
        }

        const questionData = (await questionResponse.json()) as QuestionItem
        if (!cancelled) {
          setQuestion(questionData)
        }
      } catch {
        if (!cancelled) {
          setError('Não foi possível carregar a questão para o playground.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [questionId])

  useEffect(() => {
    if (!question) return
    if (initializedQuestionCodeRef.current === question.id) return

    const prompt = question.questionBody.replaceAll('*/', '* /')
    setCode(`/**\n * Questão #${question.id}\n * ${prompt}\n */\n\n${DEFAULT_PLAYGROUND_CODE}`)
    initializedQuestionCodeRef.current = question.id
  }, [question])

  const handleSubmitForReview = async () => {
    if (!question) return

    setSubmitting(true)
    setError('')
    setReviewResult(null)
    setReviewError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/answers`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.id,
          answerBody: code,
        }),
      })

      if (response.ok) {
        const result = (await response.json()) as AnswerReviewResponse
        setReviewResult(result)
        return
      }

      const data = (await response.json()) as Partial<ReviewApiError>
      setReviewError({
        code: data.code ?? 'REVIEW_ERROR',
        message: data.message ?? 'Falha na revisão.',
        status: data.status ?? response.status,
      })
    } catch {
      setError('Não foi possível conectar ao endpoint de revisão.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="flex justify-between items-center h-16 px-gutter w-full sticky top-0 z-30 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-md">
          <span className="font-h2 text-h2 font-extrabold text-primary">CodeLab</span>
          <div className="h-6 w-[1px] bg-outline-variant mx-sm"></div>
          <span className="font-label text-label text-on-surface-variant tracking-wider uppercase">Playground</span>
        </div>
        <div className="flex items-center gap-md">
          <button
            type="button"
            className="border border-outline-variant px-md py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high"
            onClick={() => {
              window.location.href = '/admin/questions'
            }}
          >
            Voltar
          </button>
          <div className="text-right">
            <p className="text-body-sm text-on-surface">{profile?.name ?? 'Administrador'}</p>
            <p className="text-label text-on-surface-variant">{profile?.email ?? ''}</p>
          </div>
        </div>
      </header>

      <SandpackProvider
        template="vanilla-ts"
        theme="dark"
        files={{
          '/index.ts': code,
        }}
        customSetup={{ entry: '/index.ts' }}
      >
        <main className="flex-1 flex overflow-hidden">
          <section className="flex-1 flex flex-col border-r border-outline-variant min-w-0">
            <div className="h-12 bg-surface-container-low flex items-center justify-between px-md border-b border-outline-variant">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">terminal</span>
                <span className="font-label text-label text-on-surface">answer.ts</span>
              </div>
              <button
                type="button"
                className="flex items-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary font-label font-bold hover:brightness-110 transition-all disabled:opacity-70"
                onClick={handleSubmitForReview}
                disabled={submitting || loading || !question}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                {submitting ? 'Enviando...' : 'Enviar para revisão'}
              </button>
            </div>

            <div className="flex-1 p-gutter bg-surface-container-lowest overflow-auto">
              <div className="mb-md space-y-xs">
                <p className="text-label text-on-surface-variant uppercase">Questão #{questionId}</p>
                <p className="text-body-sm text-on-surface">{question?.questionBody ?? 'Carregando questão...'}</p>
              </div>

              <SandpackLayout className="!bg-transparent !border-outline-variant !rounded-xl !overflow-hidden !border">
                <PlaygroundCodeEditor loading={loading} onCodeChange={setCode} />
              </SandpackLayout>
            </div>
          </section>

          <aside className="w-[420px] bg-surface flex flex-col">
            <div className="h-12 bg-surface-container flex items-center px-md border-b border-outline-variant">
              <span className="font-label text-label text-on-surface uppercase tracking-tight">Validação Imediata</span>
            </div>

            <div className="p-md border-b border-outline-variant bg-surface-container-low">
              <SandpackLayout className="!bg-transparent !border-0 !rounded-none !flex-col !gap-md">
                <div className="h-32 overflow-hidden rounded-lg border border-outline-variant">
                  <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} />
                </div>
                <div className="max-h-40 overflow-auto rounded-lg border border-outline-variant">
                  <SandpackConsole resetOnPreviewRestart />
                </div>
              </SandpackLayout>
            </div>

            <div className="h-12 bg-surface-container flex items-center px-md border-b border-outline-variant">
              <span className="font-label text-label text-on-surface uppercase tracking-tight">Resultado da Revisão</span>
            </div>
            <div className="flex-1 p-gutter space-y-md overflow-auto">
              {loading ? <p className="text-on-surface-variant">Carregando...</p> : null}
              {error ? <p className="text-error">{error}</p> : null}

              {reviewResult ? (
                <div className="bg-surface-container border border-outline-variant rounded-xl p-md space-y-sm">
                  <p className="text-label text-on-surface-variant uppercase">Status</p>
                  <p className="text-h3 text-primary">{reviewResult.verificationStatus}</p>
                  <p className="text-label text-on-surface-variant uppercase">Node</p>
                  <p className="text-body-sm text-on-surface">{reviewResult.nodeVerificationResult ?? '-'}</p>
                  <p className="text-label text-on-surface-variant uppercase">IA</p>
                  <p className="text-body-sm text-on-surface">{reviewResult.aiVerificationResult ?? '-'}</p>
                </div>
              ) : null}

              {reviewError ? (
                <div className="bg-error-container border border-error rounded-xl p-md space-y-xs">
                  <p className="text-label text-on-error-container uppercase">{reviewError.code}</p>
                  <p className="text-body-sm text-on-error-container">{reviewError.message}</p>
                  <p className="text-label text-on-error-container">HTTP {reviewError.status}</p>
                </div>
              ) : null}

              {!reviewResult && !reviewError && !loading ? (
                <p className="text-on-surface-variant text-body-sm">Envie o código para ver o resultado da correção.</p>
              ) : null}
            </div>
          </aside>
        </main>
      </SandpackProvider>
    </>
  )
}

function StudentPathPage() {
  const API_BASE_URL = 'http://localhost:8080'
  const [user, setUser] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])

  useEffect(() => {
    // Puxa o usuário para exibir foto/nome e barrar quem não está logado
    fetch(`${API_BASE_URL}/api/users/me`, { credentials: 'include' })
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error('Não autenticado')
        })
        .then((data) => setUser(data))
        .catch(() => { window.location.href = '/' })

    // Puxa as questões do banco para pegar os IDs
    fetch(`${API_BASE_URL}/questions`, { credentials: 'include' })
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setQuestions(data || []))
  }, [])

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' })
    } finally {
      window.location.href = '/'
    }
  }

  // Lógica de clique na trilha
  const handleNavigateToPlayground = (topicKey: string) => {
    console.log("Tópico clicado:", topicKey);
    console.log("Questões carregadas:", questions);

    const questionFromTopic = questions.find((q) => {
      const qTopic = (q.topic || "").toString().toUpperCase().trim();
      const targetTopic = topicKey.toUpperCase().trim();

      console.log(`Comparando: ${qTopic} com ${targetTopic}`);
      return qTopic === targetTopic;
    });

    if (questionFromTopic) {
      console.log("Questão encontrada:", questionFromTopic);
      window.location.href = `/admin/questions/${questionFromTopic.id}/playground`;
    } else {
      alert(`Nenhuma questão encontrada para o tópico: ${topicKey}. Verifique o console (F12) para ver os tópicos disponíveis.`);
    }
  }

  if (!user) return <div className="flex min-h-screen items-center justify-center bg-[#0e1512] text-[#72db9f] animate-pulse">Carregando Trilha...</div>

  const photoUrl = user.photo || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp3BkeCN4Ob2TbvINS9OiWR-h28Mm_1YCP3t3UzUChVENbVCfx5_KWm83aoujbIXC1-OYEyUTosshLx8WAkP9Q6VEN7AWd7sbTdfwd3zIme-GjggGm3RtI44dLDX3ANMILnNss3fxV-bk_kG0k0ddfLaVcQOT9jOseqeFAprZNTHhtlVIYTFBvWEwPQR6UkiPWi1sikZ02EvmlmkwQPCVDOnUxVzHDvTluBL_ZzNKnpfMoUCObsMPlL8nS-aO0GGxEZdQTdxERfRM'

  return (
      <div className="flex min-h-screen w-full bg-[#0e1512] text-[#dde4df] font-sans absolute top-0 left-0 z-50">

        {/* Sidebar do Estudante */}
        <aside className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 border-r border-[#3e4941] bg-[#161d1a] w-64 z-50">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-lg bg-[#72db9f] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#003920]">terminal</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#72db9f]">CodeLab</h1>
              <p className="text-xs text-[#bdcabe]">Trilha de Aprendizado</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            <button className="w-full flex items-center gap-3 bg-[#3c4a43] text-[#aab9b0] rounded-lg px-4 py-2 text-left font-semibold text-sm">
              <span className="material-symbols-outlined">menu_book</span>
              Trilha Atual
            </button>
            <button onClick={() => window.location.href = '/perfil'} className="w-full flex items-center gap-3 text-[#bdcabe] hover:text-[#dde4df] px-4 py-2 hover:bg-[#2f3633] rounded-lg text-left font-semibold text-sm transition-all">
              <span className="material-symbols-outlined">account_circle</span>
              Meu Perfil
            </button>
          </nav>
          <div className="mt-auto pt-4">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-[#93000a] text-[#ffdad6] hover:bg-[#690005] px-4 py-2 rounded-lg text-sm font-bold transition-colors">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sair
            </button>
          </div>
        </aside>

        {/* Painel Central */}
        <main className="flex-1 ml-64 flex flex-col relative min-h-screen">
          <header className="sticky top-0 z-40 w-full flex justify-between items-center h-16 px-6 bg-[#0e1512]/80 backdrop-blur-md border-b border-[#3e4941]">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-[#1a211e] px-3 py-1 rounded-full border border-[#3e4941]">
                <span className="material-symbols-outlined text-orange-500">local_fire_department</span>
                <span className="text-md font-bold text-[#dde4df]">12</span>
              </div>
              <div className="flex items-center gap-2 bg-[#1a211e] px-3 py-1 rounded-full border border-[#3e4941]">
                <span className="material-symbols-outlined text-yellow-500">stars</span>
                <span className="text-md font-bold text-[#dde4df]">2,450</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => window.location.href = '/perfil'} className="w-10 h-10 rounded-full border-2 border-[#72db9f] p-0.5 overflow-hidden transition-transform hover:scale-105">
                <img alt="Profile" className="w-full h-full rounded-full object-cover" src={photoUrl} />
              </button>
            </div>
          </header>

          <div className="flex flex-row w-full max-w-7xl mx-auto h-full flex-1">
            <div className="flex-1 relative pb-12">
              <div className="sticky top-16 z-30 bg-[#0e1512]/60 backdrop-blur-sm py-6 px-8 mb-8 border-b border-[#3e4941]/30">
                <div className="max-w-2xl mx-auto">
                  <span className="text-xs text-[#72db9f] uppercase tracking-widest block mb-1">Unidade 1</span>
                  <h2 className="text-2xl font-bold text-[#dde4df] mb-2">Fundamentos da Programação</h2>
                  <div className="w-full bg-[#2f3633] h-3 rounded-full overflow-hidden">
                    <div className="bg-[#72db9f] h-full rounded-full w-[65%]"></div>
                  </div>
                </div>
              </div>

              <div className="relative py-12 flex flex-col items-center gap-24 min-h-[700px]">
                <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-full pointer-events-none" preserveAspectRatio="none">
                  <path className="stroke-[#2d3a34] stroke-[8] fill-none" style={{ strokeDasharray: '8 8' }} d="M 96,0 C 180,100 20,200 96,300 C 180,400 20,500 96,600" />
                </svg>

                {/* Nó: Variáveis */}
                <div className="relative z-10 flex flex-col items-center">
                  <button onClick={() => handleNavigateToPlayground('OPERADORES_TIPOS_E_VARIAVEIS')} className="w-24 h-24 rounded-full bg-[#72db9f] flex items-center justify-center text-[#003920] shadow-lg transform hover:scale-110 transition-transform focus:outline-none">
                    <span className="material-symbols-outlined text-[40px]">variables</span>
                  </button>
                  <div className="mt-2 bg-[#1a211e] border border-[#3e4941] px-3 py-1 rounded-xl">
                    <span className="text-xs font-semibold text-[#72db9f]">Variáveis</span>
                  </div>
                </div>

                {/* Nó: Condicionais   */}
                <div className="relative z-10 flex flex-col items-center translate-x-16">
                  <button onClick={() => handleNavigateToPlayground('EXECUCAO_CONDICIONAL')} className="w-24 h-24 rounded-full bg-[#72db9f] flex items-center justify-center text-[#003920] shadow-lg transform hover:scale-110 transition-transform focus:outline-none">
                    <span className="material-symbols-outlined text-[40px]">data_object</span>
                  </button>
                  <div className="mt-2 bg-[#1a211e] border border-[#3e4941] px-3 py-1 rounded-xl">
                    <span className="text-xs font-semibold text-[#72db9f]">Condicionais</span>
                  </div>
                </div>

                {/* Nó: Laços */}
                <div className="relative z-10 flex flex-col items-center -translate-x-16">
                  <button onClick={() => handleNavigateToPlayground('LACOS')} className="w-28 h-28 rounded-full bg-[#37a36c] flex items-center justify-center text-[#002110] shadow-2xl transform hover:scale-110 transition-transform border-4 border-[#72db9f] focus:outline-none animate-[pulse_2s_infinite]">
                    <span className="material-symbols-outlined text-[48px]">alt_route</span>
                  </button>
                  <div className="mt-3 bg-[#72db9f] px-4 py-2 rounded-2xl shadow-xl animate-bounce">
                    <span className="text-sm font-bold text-[#003920]">Laços</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  )
}


export default function App() {
  const currentPath = window.location.pathname
  const isRegisterPage = currentPath === '/register'
  const isProfilePage = currentPath === '/perfil'
  const isAdminQuestionsPage = currentPath === '/admin/questions'
  const isStudentPathPage = currentPath === '/trilha'

  const adminPlaygroundMatch = currentPath.match(/^\/admin\/questions\/(\d+)\/playground$/)
  const playgroundQuestionId = adminPlaygroundMatch ? Number(adminPlaygroundMatch[1]) : null

  const registered = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('registered') === '1'
  }, [])

  return (
      <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col antialiased">
        {isRegisterPage ? (
            <RegisterPage />
        ) : playgroundQuestionId ? (
            <AdminPlaygroundPage questionId={playgroundQuestionId} />
        ) : isAdminQuestionsPage ? (
            <AdminQuestionsPage />
        ) : isProfilePage ? (
            <ProfilePage />
        ) : isStudentPathPage ? (
            <StudentPathPage />
        ) : (
            <LoginPage registered={registered} />
        )}
        <BackgroundDecor />
      </div>
  )
}


