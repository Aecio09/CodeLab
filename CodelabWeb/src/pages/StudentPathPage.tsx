import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import type { TopicStatus, UserProfile } from '../types'
import { EditProfileModal } from '../components/EditProfileModal'

const TOPIC_METADATA: Record<string, { label: string; icon: string }> = {
  OPERADORES_TIPOS_E_VARIAVEIS: { label: 'Variáveis e Tipos', icon: 'variables' },
  EXECUCAO_CONDICIONAL: { label: 'Condicionais', icon: 'data_object' },
  OPERADORES_LOGICOS: { label: 'Lógica', icon: 'rule' },
  LACOS: { label: 'Laços de Repetição', icon: 'alt_route' },
  SUBPROGRAMAS: { label: 'Funções', icon: 'functions' },
  VETORES: { label: 'Vetores', icon: 'reorder' },
  ARRAYS: { label: 'Arrays', icon: 'view_module' },
  TIPOS_CRIADOS_PELO_PROGRAMADOR: { label: 'Estruturas', icon: 'account_tree' },
}

export function StudentPathPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<TopicStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch(`${API_BASE_URL}/api/users/me`, { credentials: 'include' })
        if (!userRes.ok) throw new Error('Não autenticado')
        const userData = (await userRes.json()) as UserProfile
        setUser(userData)

        const progressRes = await fetch(`${API_BASE_URL}/api/trail/progress`, { credentials: 'include' })
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          setProgress(progressData)
        }
      } catch (err) {
        console.error(err)
        window.location.href = '/'
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' })
    } finally {
      window.location.href = '/'
    }
  }

  const handleNavigateToPlayground = async (topicKey: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/questions/next?topic=${topicKey}`, { credentials: 'include' })
      if (res.ok) {
        const nextQuestion = await res.json()
        window.location.href = `/playground/${nextQuestion.id}`
      } else if (res.status === 403) {
        alert('Esta lição ainda está bloqueada para você!')
      } else {
        alert('Nenhuma questão disponível para esta lição no momento.')
      }
    } catch (error) {
      console.error('Erro ao buscar próxima questão:', error)
    }
  }

  if (loading || !user)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-primary animate-pulse font-mono" role="status" aria-live="polite">
        Carregando Sua Jornada...
      </div>
    )

  // Pattern offset in pixels
  const getXOffset = (index: number) => {
    const pattern = [0, 80, 140, 80, 0, -80, -140, -80]
    return pattern[index % pattern.length]
  }

  // Vertical math: py-32 (128px) + half bubble (48px) + index * (bubble 96px + gap 128px)
  const getNodeY = (index: number) => 128 + 48 + index * 224

  return (
    <div className="flex min-h-screen w-full bg-background text-on-surface font-sans absolute top-0 left-0 z-50 overflow-x-hidden">
      
      {/* Neon Background Glows */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>

      {/* Sidebar do Estudante */}
      <aside className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 border-r border-outline-variant bg-surface-container-low w-64 z-[60]">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-on-primary">terminal</span>
          </div>
          <div>
            <h1 className="text-lg font-h2 font-bold text-primary tracking-tight">CodeLab</h1>
          </div>
        </div>
        <nav className="flex-1 space-y-1" aria-label="Navegação principal">
          <a className="w-full flex items-center gap-3 bg-secondary-container text-on-secondary-container rounded-lg px-4 py-2 text-left font-semibold text-sm" href="/trilha" aria-current="page">
            <span className="material-symbols-outlined">map</span>
            Minha Trilha
          </a>
          <a
            href="/playground"
            className="w-full flex items-center gap-3 text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-surface-container-highest rounded-lg text-left font-semibold text-sm transition-all"
          >
            <span className="material-symbols-outlined">terminal</span>
            Playground
          </a>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center gap-3 text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-surface-container-highest rounded-lg text-left font-semibold text-sm transition-all"
          >
            <span className="material-symbols-outlined">account_circle</span>
            Meu Perfil
          </button>
        </nav>
        <div className="mt-auto pt-4 border-t border-outline-variant">
          <button
            onClick={handleLogout}
            className="btn-danger w-full !h-10"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Painel Central */}
      <main className="flex-1 ml-64 flex flex-col relative min-h-screen z-10">
        <header className="sticky top-0 z-[60] w-full flex justify-between items-center h-16 px-8 bg-background/80 backdrop-blur-md border-b border-outline-variant">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-surface-container px-4 py-1.5 rounded-full border border-outline-variant shadow-inner">
              <span className="material-symbols-outlined text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="text-md font-black text-on-surface">{user.userStreak}</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container px-4 py-1.5 rounded-full border border-outline-variant shadow-inner">
              <span className="material-symbols-outlined text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="text-md font-black text-on-surface">{Math.floor(user.userPoints)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-10 h-10 rounded-full border-2 border-primary/50 p-0.5 overflow-hidden transition-all hover:border-primary hover:scale-105 active:scale-95"
            >
              <img alt="Profile" className="w-full h-full rounded-full object-cover" src={user.photo || 'https://via.placeholder.com/160x160?text=User'} />
            </button>
          </div>
        </header>

        <div className="flex-1 w-full">
          {progress.map((unit, unitIndex) => {
            const meta = TOPIC_METADATA[unit.topicName] || { label: unit.topicName, icon: 'help' }
            const unitProgress = (unit.totalActivitiesCompleted / (unit.totalLessons * 2)) * 100
            const isUnitLocked = unit.status === 'LOCKED'

            return (
              <section key={unit.topicName} className={`relative ${isUnitLocked ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                
                {/* Full-width Unit Header */}
                <div className="sticky top-16 z-50 w-full bg-surface-container-low/95 backdrop-blur-md py-6 px-12 border-b border-outline-variant shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                       <span className="text-[10px] text-primary uppercase tracking-[0.4em] font-black block mb-1 opacity-80">Unidade {unitIndex + 1}</span>
                       <h2 className="text-2xl font-black text-on-surface uppercase tracking-tight italic">{meta.label}</h2>
                    </div>
                    <div className="flex-1 max-w-sm">
                       <div className="flex justify-between items-end mb-1.5">
                          <span className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest">Maestria</span>
                          <span className="text-[10px] text-primary font-black tracking-tighter bg-primary/10 px-2 py-0.5 rounded">{Math.round(unitProgress)}%</span>
                       </div>
                       <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-outline-variant">
                         <div 
                           className="bg-primary h-full transition-all duration-1000 shadow-sm" 
                           style={{ width: `${unitProgress}%` }}
                         ></div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Path Area */}
                <div className="relative py-32 flex flex-col items-center gap-32 min-h-[500px]">
                  
                  {/* SVG Path - Accurate Geometry */}
                  {!isUnitLocked && (
                    <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-full pointer-events-none z-0" preserveAspectRatio="none">
                      <path
                        className="stroke-surface-container-high stroke-[12] fill-none"
                        d={`M ${200 + getXOffset(0)},176 ${Array.from({ length: unit.totalLessons - 1 }).map((_, i) => {
                          const x1 = 200 + getXOffset(i)
                          const y1 = getNodeY(i)
                          const x2 = 200 + getXOffset(i + 1)
                          const y2 = getNodeY(i + 1)
                          return `C ${x1},${y1 + 112} ${x2},${y1 + 112} ${x2},${y2}`
                        }).join(' ')}`}
                      />
                      <path
                        className="stroke-primary stroke-[4] fill-none opacity-30"
                        style={{ strokeDasharray: '12 12' }}
                        d={`M ${200 + getXOffset(0)},176 ${Array.from({ length: unit.totalLessons - 1 }).map((_, i) => {
                          const x1 = 200 + getXOffset(i)
                          const y1 = getNodeY(i)
                          const x2 = 200 + getXOffset(i + 1)
                          const y2 = getNodeY(i + 1)
                          return `C ${x1},${y1 + 112} ${x2},${y1 + 112} ${x2},${y2}`
                        }).join(' ')}`}
                      />
                    </svg>
                  )}

                  {Array.from({ length: unit.totalLessons }).map((_, lessonIdx) => {
                    const lessonNum = lessonIdx + 1
                    let lessonStatus: 'COMPLETED' | 'AVAILABLE' | 'LOCKED' = 'LOCKED'
                    
                    if (unit.status === 'COMPLETED') {
                      lessonStatus = 'COMPLETED'
                    } else if (unit.status === 'AVAILABLE') {
                      if (lessonNum < unit.currentLesson) lessonStatus = 'COMPLETED'
                      else if (lessonNum === unit.currentLesson) lessonStatus = 'AVAILABLE'
                    }

                    const xOffsetPx = getXOffset(lessonIdx)
                    const isCompleted = lessonStatus === 'COMPLETED'
                    const isAvailable = lessonStatus === 'AVAILABLE'

                    return (
                      <div 
                        key={`${unit.topicName}-${lessonNum}`} 
                        className="relative z-10"
                        style={{ transform: `translateX(${xOffsetPx}px)` }}
                      >
                        <button
                          disabled={lessonStatus === 'LOCKED'}
                          onClick={() => handleNavigateToPlayground(unit.topicName)}
                          className={`
                            relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface border-4 cursor-pointer
                            ${lessonStatus === 'LOCKED' ? 'bg-surface-container-low border-surface-container-highest text-outline cursor-not-allowed scale-90' : 
                              isCompleted ? 'bg-primary border-primary/20 text-on-primary hover:scale-110 shadow-md' : 
                              'bg-primary-container border-primary text-on-surface hover:scale-110 shadow-lg animate-pulse'}
                          `}
                        >
                          <span className="material-symbols-outlined text-[42px]">
                            {lessonStatus === 'LOCKED' ? 'lock' : (isCompleted ? 'check' : meta.icon)}
                          </span>

                          <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black
                            ${lessonStatus === 'LOCKED' ? 'bg-surface-container border-surface-container-highest text-outline' : 'bg-background border-primary text-primary shadow-lg'}
                          `}>
                            {lessonNum}
                          </div>
                        </button>
                        
                        {isAvailable && (
                          <div className="absolute top-1/2 -translate-y-1/2 left-full ml-8 whitespace-nowrap bg-primary text-on-primary px-4 py-2 rounded-xl text-[10px] font-black shadow-lg animate-bounce">
                            LIÇÃO ATUAL
                            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-primary rotate-45"></div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </main>

      <EditProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={user}
        onUpdate={(updated) => setUser(updated)}
      />
    </div>
  )
}