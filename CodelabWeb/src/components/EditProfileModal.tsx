import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { API_BASE_URL } from '../constants'
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
  const [previewUrl, setPreviewUrl] = useState<string>(resolvePhotoUrl(user.photo))
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

  if (!isOpen) return null

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Update basic info
      const res = await fetch(`${API_BASE_URL}/api/users/perfil`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) throw new Error('Falha ao atualizar perfil')
      let updatedUser = (await res.json()) as UserProfile

      // 2. Upload photo if changed
      if (photoFile) {
        const formData = new FormData()
        formData.append('photo', photoFile)
        const photoRes = await fetch(`${API_BASE_URL}/api/users/upload-photo`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
        if (photoRes.ok) {
          const photoPath = await photoRes.text()
          updatedUser = { ...updatedUser, photo: photoPath }
        }
      }

      onUpdate(updatedUser)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('TEM CERTEZA? Esta ação é irreversível.')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/perfil`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) window.location.href = '/'
    } catch (err) {
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
      <div ref={modalRef} className="bg-surface-container border border-outline-variant w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
          <div>
            <h2 id="edit-profile-title" className="text-h3 font-h3 font-bold text-on-surface">Editar Perfil</h2>
            <p className="text-label font-label text-on-surface-variant uppercase tracking-wider">Atualize suas informações</p>
          </div>
          <button onClick={onClose} aria-label="Fechar modal" className="text-on-surface-variant hover:text-primary transition-colors p-xs rounded-lg">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-lg space-y-xl overflow-y-auto max-h-[80vh]">
          
          {/* Avatar Section */}
          <div className="flex flex-col md:flex-row items-center gap-lg border-b border-outline-variant pb-lg">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full border-4 border-primary/20 p-1 overflow-hidden shadow-md">
                <img alt="User Avatar" className="w-full h-full rounded-full object-cover" src={previewUrl} />
              </div>
              <label className="absolute bottom-1 right-1 bg-primary text-on-primary p-1.5 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg border-2 border-surface-container" htmlFor="avatar-upload">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </label>
              <input className="hidden" id="avatar-upload" type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-h3 font-h3 font-semibold text-on-surface">Sua Foto</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant mb-2">JPG ou PNG • Máx 2MB</p>
              <div className="flex gap-2 justify-center md:justify-start">
                <label htmlFor="avatar-upload" className="btn-secondary !h-9 !px-md !text-[12px] cursor-pointer">Trocar Foto</label>
                {user.photo && <button type="button" className="btn-danger !h-9 !px-md !text-[12px]">Remover</button>}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <label className="form-label" htmlFor="edit-name">Nome Completo</label>
              <input
                id="edit-name"
                className="input-field"
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
                className="input-field"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label" htmlFor="edit-password">Nova Senha (opcional)</label>
              <input
                id="edit-password"
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-body-sm font-body-sm text-error font-semibold" role="alert">{error}</p>}

          {/* Footer Actions */}
          <div className="pt-lg border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-md w-full md:w-auto">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 md:flex-none"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary hidden md:inline-flex">Cancelar</button>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="btn-danger"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Deletar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
