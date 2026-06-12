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
      <div className="flex min-h-screen items-center justify-center bg-[#0e1512] text-[#72db9f] animate-pulse">
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
    <div className="flex min-h-screen w-full bg-[#0e1512] text-[#dde4df] font-sans absolute top-0 left-0 z-50 overflow-x-hidden">
      
      {/* Neon Background Glows */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>

      {/* Sidebar do Estudante */}
      <aside className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 border-r border-[#3e4941] bg-[#161d1a] w-64 z-[60]">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-lg bg-[#72db9f] flex items-center justify-center shadow-[0_0_20px_rgba(114,219,159,0.2)]">
            <span className="material-symbols-outlined text-[#003920]">terminal</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#72db9f]">CodeLab</h1>
            <p className="text-[10px] text-[#bdcabe] uppercase tracking-widest font-bold">Plataforma</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <button className="w-full flex items-center gap-3 bg-[#3c4a43] text-[#aab9b0] rounded-lg px-4 py-2 text-left font-semibold text-sm">
            <span className="material-symbols-outlined">map</span>
            Minha Trilha
          </button>
          <button
            onClick={() => window.location.href = '/playground'}
            className="w-full flex items-center gap-3 text-[#bdcabe] hover:text-[#dde4df] px-4 py-2 hover:bg-[#2f3633] rounded-lg text-left font-semibold text-sm transition-all"
          >
            <span className="material-symbols-outlined">terminal</span>
            Playground
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center gap-3 text-[#bdcabe] hover:text-[#dde4df] px-4 py-2 hover:bg-[#2f3633] rounded-lg text-left font-semibold text-sm transition-all"
          >
            <span className="material-symbols-outlined">account_circle</span>
            Meu Perfil
          </button>
        </nav>
        <div className="mt-auto pt-4 border-t border-outline-variant/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#93000a]/10 text-[#ffdad6] hover:bg-[#93000a]/20 border border-[#93000a]/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Painel Central */}
      <main className="flex-1 ml-64 flex flex-col relative min-h-screen z-10">
        <header className="sticky top-0 z-[60] w-full flex justify-between items-center h-16 px-8 bg-[#0e1512]/80 backdrop-blur-md border-b border-[#3e4941]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-[#1a211e] px-4 py-1.5 rounded-full border border-[#3e4941] shadow-inner">
              <span className="material-symbols-outlined text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="text-md font-black text-[#dde4df]">{user.userStreak}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#1a211e] px-4 py-1.5 rounded-full border border-[#3e4941] shadow-inner">
              <span className="material-symbols-outlined text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="text-md font-black text-[#dde4df]">{Math.floor(user.userPoints)}</span>
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
                <div className="sticky top-16 z-50 w-full bg-[#161d1a]/95 backdrop-blur-md py-6 px-12 border-b border-[#3e4941] shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                       <span className="text-[10px] text-[#72db9f] uppercase tracking-[0.4em] font-black block mb-1 opacity-70">Unidade {unitIndex + 1}</span>
                       <h2 className="text-2xl font-black text-[#dde4df] uppercase tracking-tight italic">{meta.label}</h2>
                    </div>
                    <div className="flex-1 max-w-sm">
                       <div className="flex justify-between items-end mb-1.5">
                          <span className="text-[10px] text-[#bdcabe] uppercase font-black tracking-widest">Maestria</span>
                          <span className="text-[10px] text-[#72db9f] font-black tracking-tighter bg-primary/10 px-2 py-0.5 rounded">{Math.round(unitProgress)}%</span>
                       </div>
                       <div className="w-full bg-[#0e1512] h-2 rounded-full overflow-hidden border border-[#3e4941]">
                         <div 
                           className="bg-primary h-full transition-all duration-1000 shadow-[0_0_15px_rgba(114,219,159,0.4)]" 
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
                        className="stroke-[#1a211e] stroke-[12] fill-none"
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
                            relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 focus:outline-none border-4
                            ${lessonStatus === 'LOCKED' ? 'bg-[#161d1a] border-[#2f3633] text-[#4a5750] cursor-not-allowed scale-90' : 
                              isCompleted ? 'bg-primary border-primary/20 text-[#003920] hover:scale-110 shadow-[0_0_20px_rgba(114,219,159,0.1)]' : 
                              'bg-[#37a36c] border-primary text-[#dde4df] hover:scale-110 shadow-[0_0_50px_rgba(114,219,159,0.3)] animate-pulse'}
                          `}
                        >
                          <span className="material-symbols-outlined text-[42px]">
                            {lessonStatus === 'LOCKED' ? 'lock' : (isCompleted ? 'check' : meta.icon)}
                          </span>

                          <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black
                            ${lessonStatus === 'LOCKED' ? 'bg-[#1a211e] border-[#2f3633] text-[#4a5750]' : 'bg-[#0e1512] border-primary text-primary shadow-lg'}
                          `}>
                            {lessonNum}
                          </div>
                        </button>
                        
                        {isAvailable && (
                          <div className="absolute top-1/2 -translate-y-1/2 left-full ml-8 whitespace-nowrap bg-primary text-[#003920] px-4 py-2 rounded-xl text-[10px] font-black shadow-[0_10px_30px_rgba(114,219,159,0.3)] animate-bounce">
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