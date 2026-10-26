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
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(resolvePhotoUrl(user.photo, user.name))
  const [removePhoto, setRemovePhoto] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      setTimeout(() => {
        const focusable = modalRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      }, 50)
    } else {
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
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
  }, [onClose])

  if (!isOpen) return null


  const handleRemovePhotoClick = () => {
    setPhotoFile(null)
    setRemovePhoto(true)
    setPreviewUrl(resolvePhotoUrl(null, name))
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setRemovePhoto(false)
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
            const jsonObj = JSON.parse(textResponse)
            photoPath = jsonObj.photo || jsonObj.photoUrl || jsonObj.path || textResponse
          } catch {
            // resposta em texto puro; mantém o caminho original
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
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil.')
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-trail-background/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-md"
      >
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500 via-cyan-400 to-sky-300 opacity-60"
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b-[0.5px] border-trail-line bg-white/[0.02] px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-trail-cyan">
              Conta
            </p>
            <h2 id="edit-profile-title" className="mt-1 font-serif text-2xl leading-tight text-white sm:text-3xl">
              Editar perfil
            </h2>
            <p className="mt-1 text-xs font-light text-neutral-400">
              Atualize suas informações.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border-[0.5px] border-trail-line bg-white/[0.04] text-neutral-400 transition-colors hover:border-trail-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6" aria-busy={loading}>
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 border-b-[0.5px] border-trail-line pb-5 sm:flex-row">
            <div className="relative shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-full border-[0.5px] border-trail-line bg-white/[0.04] p-1">
                <img alt="Foto de perfil" className="h-full w-full rounded-full object-cover" src={previewUrl} />
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-[0.5px] border-trail-line bg-trail-surface text-neutral-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-colors hover:border-cyan-400/30 hover:text-white"
              >
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">photo_camera</span>
                <span className="sr-only">Trocar foto</span>
              </label>
              <input className="hidden" id="avatar-upload" type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>

            <div className="text-center sm:text-left">
              <h3 className="font-serif text-lg text-white">Sua foto</h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                JPG ou PNG • Máx 2MB
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded border-[0.5px] border-trail-line bg-white/[0.04] px-3 font-mono text-[10px] uppercase tracking-wider text-neutral-300 transition-colors hover:border-trail-accent hover:text-white"
                >
                  Trocar foto
                </label>
                {(user.photo || previewUrl !== resolvePhotoUrl(null, name)) && (
                  <button
                    type="button"
                    onClick={handleRemovePhotoClick}
                    className="inline-flex h-9 items-center justify-center rounded border-[0.5px] border-red-500/20 bg-red-500/[0.06] px-3 font-mono text-[10px] uppercase tracking-wider text-red-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400" htmlFor="edit-name">
                Nome completo
              </label>
              <input
                id="edit-name"
                className="w-full rounded border-[0.5px] border-trail-line bg-trail-background px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 transition-colors hover:border-trail-accent focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400" htmlFor="edit-email">
                E-mail
              </label>
              <input
                id="edit-email"
                className="w-full rounded border-[0.5px] border-trail-line bg-trail-background px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 transition-colors hover:border-trail-accent focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400" htmlFor="edit-password">
                Nova senha <span className="normal-case tracking-normal text-neutral-500">(opcional)</span>
              </label>
              <input
                id="edit-password"
                className="w-full rounded border-[0.5px] border-trail-line bg-trail-background px-3 py-2.5 font-mono text-sm tracking-widest text-white placeholder:text-neutral-500 transition-colors hover:border-trail-accent focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="mt-1.5 font-mono text-[10px] text-neutral-500">
                Deixe em branco para manter a senha atual.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded border-[0.5px] border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
              <span className="material-symbols-outlined mt-px text-[16px]" aria-hidden="true">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col gap-3 border-t-[0.5px] border-trail-line pt-5 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded bg-white px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-950 shadow-[0_0_22px_rgba(255,255,255,0.12)] transition-all hover:bg-neutral-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trail-surface disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin" aria-hidden="true">progress_activity</span>
                    Salvando...
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-10 w-full items-center justify-center rounded border-[0.5px] border-trail-line bg-white/[0.04] px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-neutral-300 transition-colors hover:border-trail-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trail-surface sm:w-auto"
              >
                Cancelar
              </button>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded border-[0.5px] border-red-500/20 bg-red-500/[0.06] px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-red-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 md:w-auto"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
              Deletar conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}