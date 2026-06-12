import { useState } from 'react'
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-[#161f1b] border border-[#2d3a34] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-lg border-b border-[#2d3a34] flex justify-between items-center bg-[#1a211e]">
          <div>
            <h2 className="text-xl font-black text-[#dde4df] uppercase tracking-tight">Editar Perfil</h2>
            <p className="text-[10px] text-[#bdcabe] uppercase tracking-widest font-bold">Atualize suas informações</p>
          </div>
          <button onClick={onClose} className="text-[#bdcabe] hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-lg space-y-xl overflow-y-auto max-h-[80vh]">
          
          {/* Avatar Section */}
          <div className="flex flex-col md:flex-row items-center gap-lg border-b border-outline-variant pb-lg">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full border-4 border-primary/20 p-1 overflow-hidden shadow-[0_0_30px_rgba(114,219,159,0.1)]">
                <img alt="User Avatar" className="w-full h-full rounded-full object-cover" src={previewUrl} />
              </div>
              <label className="absolute bottom-1 right-1 bg-primary text-[#003920] p-1.5 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg border-2 border-[#161f1b]" htmlFor="avatar-upload">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </label>
              <input className="hidden" id="avatar-upload" type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-lg font-bold text-[#dde4df]">Sua Foto</h3>
              <p className="text-[10px] text-[#bdcabe] uppercase tracking-wider mb-2">JPG ou PNG • Máx 2MB</p>
              <div className="flex gap-2 justify-center md:justify-start">
                <label htmlFor="avatar-upload" className="text-[10px] font-black text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-all uppercase cursor-pointer">Trocar Foto</label>
                {user.photo && <button type="button" className="text-[10px] font-black text-error border border-error/30 px-3 py-1.5 rounded-lg hover:bg-error/10 transition-all uppercase">Remover</button>}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="space-y-xs">
              <label className="text-[10px] font-black text-[#bdcabe] uppercase tracking-widest">Nome Completo</label>
              <input
                className="w-full bg-[#0e1512] border border-[#3e4941] rounded-xl px-4 py-3 text-[#dde4df] font-bold focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-xs">
              <label className="text-[10px] font-black text-[#bdcabe] uppercase tracking-widest">E-mail</label>
              <input
                className="w-full bg-[#0e1512] border border-[#3e4941] rounded-xl px-4 py-3 text-[#dde4df] font-bold focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2 space-y-xs">
              <label className="text-[10px] font-black text-[#bdcabe] uppercase tracking-widest">Nova Senha (opcional)</label>
              <input
                className="w-full bg-[#0e1512] border border-[#3e4941] rounded-xl px-4 py-3 text-[#dde4df] font-bold focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-xs text-error font-bold uppercase tracking-tight">{error}</p>}

          {/* Footer Actions */}
          <div className="pt-lg border-t border-[#2d3a34] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-4 w-full md:w-auto">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 md:flex-none bg-gradient-to-br from-[#1b8f5a] to-[#37a36c] text-[#003920] font-black px-8 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/10 uppercase text-xs"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button type="button" onClick={onClose} className="hidden md:block text-[10px] font-black text-[#bdcabe] hover:text-[#dde4df] px-4 py-3 transition-colors uppercase">Cancelar</button>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="flex items-center gap-1 text-[10px] font-black text-error hover:bg-error/10 px-4 py-2 rounded-lg transition-all uppercase"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Deletar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
