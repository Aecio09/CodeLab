import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { API_BASE_URL } from '../constants'
import { resolvePhotoUrl } from '../utils'
import type { UserProfile } from '../types'
import { SharedFooter } from '../components/SharedFooter'

export function ProfilePage() {
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
    return <main className="flex-grow flex items-center justify-center text-on-surface-variant" role="status" aria-live="polite">Redirecionando para o painel admin...</main>
  }

  return (
    <>
      <header className="bg-surface border-b border-outline-variant z-50 sticky top-0">
        <div className="flex justify-between items-center px-lg md:px-margin-desktop h-16 max-w-max-width mx-auto">
          <div className="text-lg font-h2 font-bold text-primary tracking-tight">CodeLab</div>
          <div className="flex items-center gap-md">
            <span className="text-body-sm font-body-sm text-on-surface-variant uppercase font-semibold">{profile?.role ?? 'USER'}</span>
            <button
              type="button"
              className="btn-secondary !h-9 !px-md"
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
                className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-surface-container-highest shadow-md"
              />
              <h1 className="text-h1 font-h1 font-bold text-on-surface">Meu perfil</h1>
              <p className="text-body-sm font-body-sm text-on-surface-variant">Gerencie seus dados e mantenha sua conta atualizada.</p>
            </div>

            {loading ? <p className="text-body-sm font-body-sm text-on-surface-variant" role="status" aria-live="polite">Carregando perfil...</p> : null}
            {error ? <p className="text-error text-body-sm font-semibold" role="alert">{error}</p> : null}
            {success ? <p className="text-primary text-body-sm font-semibold" aria-live="polite">{success}</p> : null}

            <form className="space-y-md" onSubmit={handleUpdateProfile}>
              <div>
                <label className="form-label" htmlFor="profile-name">
                  Nome
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="profile-email">
                  E-mail
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="profile-password">
                  Nova senha
                </label>
                <input
                  id="profile-password"
                  type="password"
                  className="input-field"
                  value={password}
                  placeholder="Opcional"
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                className="btn-primary w-full"
                type="submit"
                disabled={loading}
              >
                Salvar alterações
              </button>
            </form>

            <form className="space-y-md" onSubmit={handleUploadPhoto}>
              <div>
                <label className="form-label" htmlFor="profile-photo">
                  Foto de perfil
                </label>
                <input
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  className="w-full text-body-sm text-on-surface file:mr-sm file:py-xs file:px-md file:rounded-lg file:border file:border-outline-variant file:bg-surface-container-high file:text-on-surface file:font-semibold file:cursor-pointer hover:file:bg-surface-container-highest transition-all"
                  onChange={handlePhotoChange}
                  disabled={loading}
                />
              </div>
              <button
                className="btn-secondary w-full"
                type="submit"
                disabled={loading}
              >
                Atualizar foto
              </button>
            </form>

            <div className="pt-md border-t border-outline-variant">
              <button
                type="button"
                className="btn-danger w-full"
                onClick={handleDeleteAccount}
              >
                Deletar Conta
              </button>
            </div>
          </div>
        </div>
      </main>

      <SharedFooter />
    </>
  )
}
