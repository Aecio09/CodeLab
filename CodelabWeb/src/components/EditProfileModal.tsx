import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { API_BASE_URL } from '../constants'
import { authFetch } from '../lib/api'
import { resolvePhotoUrl } from '../utils'
import type { UserProfile } from '../types'

type Props = {
  isOpen: boolean
  onClose: () => void
  user: UserProfile
  onUpdate: (updated: UserProfile) => void
}

export function EditProfileModal({ isOpen, onClose, user, onUpdate }: Props) {
  if (!isOpen) return null
  return (
    <ProfileForm
      key={`${user.id}:${user.photo ?? 'none'}`}
      onClose={onClose}
      user={user}
      onUpdate={onUpdate}
    />
  )
}

function ProfileForm({ onClose, user, onUpdate }: Omit<Props, 'isOpen'>) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(resolvePhotoUrl(user.photo, user.name))
  const [removePhoto, setRemovePhoto] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
    const focusTimer = setTimeout(() => {
      const focusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    }, 50)

    return () => {
      clearTimeout(focusTimer)
      previousFocusRef.current?.focus()
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable || focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  const handleRemovePhotoClick = () => {
    setPhotoFile(null)
    setRemovePhoto(true)
    setPhotoFailed(false)
    setPreviewUrl(resolvePhotoUrl(null, name))
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setRemovePhoto(false)
      setPhotoFailed(false)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await authFetch(`${API_BASE_URL}/api/users/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) throw new Error('Falha ao atualizar perfil')
      let updatedUser = (await res.json()) as UserProfile

      if (photoFile) {
        const formData = new FormData()
        formData.append('photo', photoFile)

        const photoRes = await authFetch(`${API_BASE_URL}/api/users/upload-photo`, {
          method: 'POST',
          body: formData,
        })

        if (photoRes.ok) {
          const textResponse = await photoRes.text()
          let photoPath = textResponse
          try {
            const jsonObj = JSON.parse(textResponse) as { photo?: string; photoUrl?: string; path?: string }
            photoPath = jsonObj.photo || jsonObj.photoUrl || jsonObj.path || textResponse
          } catch {
            photoPath = textResponse
          }

          updatedUser = { ...updatedUser, photo: photoPath }
        } else {
          throw new Error(`Erro ao enviar foto.`)
        }
      } else if (removePhoto) {

        const deleteRes = await authFetch(`${API_BASE_URL}/api/users/photo`, {
          method: 'DELETE',
        })

        if (deleteRes.ok) {
          updatedUser = { ...updatedUser, photo: null } // Limpa no Front
        } else {
          console.error("Falha ao deletar foto no backend")
        }
      }
      onUpdate(updatedUser)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar as alterações.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('TEM CERTEZA? Esta ação é irreversível.')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/api/users/perfil`, {
        method: 'DELETE',
      })
      if (res.ok) window.location.href = '/'
    } catch {
      alert('Erro ao deletar conta')
    }
  }

  return (
      <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          onKeyDown={handleKeyDown}
      >
        <div ref={modalRef} className="card-surface max-h-[90vh] w-full max-w-2xl overflow-y-auto p-0">

          <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-6 py-5">
            <div>
              <h2 id="edit-profile-title" className="font-serif text-2xl text-primary">Editar Perfil</h2>
              <p className="mt-1 font-mono text-xs uppercase tracking-widest text-on-surface-variant">Atualize suas informações</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar modal"
              className="-mr-1 -mt-1 p-1 text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-8 px-6 py-6">

            <div className="flex flex-col items-start gap-6 border-b border-outline-variant pb-6 sm:flex-row sm:items-center">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden border border-outline-variant bg-surface-container">
                  {photoFailed ? (
                    <span className="flex h-full w-full items-center justify-center" aria-hidden="true">
                      <span className="material-symbols-outlined text-4xl text-outline">person</span>
                    </span>
                  ) : (
                    <img
                      alt={`Foto de perfil de ${name}`}
                      className="h-full w-full object-cover"
                      src={previewUrl}
                      onError={() => setPhotoFailed(true)}
                    />
                  )}
                </div>
                <label
                  className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center border border-outline-variant bg-primary text-on-primary transition-opacity hover:opacity-90 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background"
                  htmlFor="avatar-upload"
                >
                  <span className="sr-only">Escolher nova foto</span>
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">photo_camera</span>
                </label>
                <input className="sr-only" id="avatar-upload" type="file" accept="image/*" onChange={handlePhotoChange} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base text-primary">Sua Foto</h3>
                <p className="mt-1 text-sm text-on-surface-variant">JPG ou PNG, até 2MB</p>
                {photoFailed && (
                  <p className="mt-2 text-sm text-error" role="status">
                    Não foi possível carregar a imagem atual. Envie uma nova ou remova a foto.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <label htmlFor="avatar-upload" className="btn-secondary cursor-pointer">Trocar Foto</label>
                  {(user.photo || removePhoto) && (
                      <button type="button" onClick={handleRemovePhotoClick} className="btn-secondary">Remover</button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="edit-name">Nome Completo</label>
                <input
                    id="edit-name"
                    className="input-field mt-2"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
              </div>
              <div>
                <label className="form-label" htmlFor="edit-email">E-mail</label>
                <input
                    id="edit-email"
                    className="input-field mt-2"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="edit-password">Nova Senha (opcional)</label>
                <input
                    id="edit-password"
                    className="input-field mt-2"
                    type="password"
                    placeholder="Deixe em branco para manter a atual"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    aria-describedby="edit-password-hint"
                />
                <p id="edit-password-hint" className="mt-2 text-xs text-on-surface-variant">
                  Só preencha se quiser trocar a senha da conta.
                </p>
              </div>
            </div>

            {error && (
              <p className="border border-error px-4 py-3 text-sm text-error" role="alert">{error}</p>
            )}

            <div className="flex flex-col-reverse items-stretch justify-between gap-4 border-t border-outline-variant pt-6 sm:flex-row sm:items-center">
              <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="btn-danger"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
                Deletar Conta
              </button>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
  )
}