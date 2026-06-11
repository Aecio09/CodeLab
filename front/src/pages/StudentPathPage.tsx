import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import type { TopicStatus, UserProfile } from '../types'

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

  const totalActivities = progress.reduce((acc, p) => acc + p.totalLessons * 2, 0)
  const completedActivities = progress.reduce((acc, p) => acc + p.totalActivitiesCompleted, 0)
  const overallProgress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0

  // Flatten lessons into a single list for the zigzag path
  const allLessons = progress.flatMap((unit) => {
    const lessons = []
    for (let i = 1; i <= unit.totalLessons; i++) {
      let lessonStatus: 'COMPLETED' | 'AVAILABLE' | 'LOCKED' = 'LOCKED'
      
      if (unit.status === 'COMPLETED') {
        lessonStatus = 'COMPLETED'
      } else if (unit.status === 'AVAILABLE') {
        if (i < unit.currentLesson) lessonStatus = 'COMPLETED'
        else if (i === unit.currentLesson) lessonStatus = 'AVAILABLE'
        else lessonStatus = 'LOCKED'
      }

      lessons.push({
        unitName: unit.topicName,
        lessonNumber: i,
        status: lessonStatus,
        isFirstInUnit: i === 1,
        totalInUnit: unit.totalLessons
      })
    }
    return lessons
  })

  const photoUrl =
    user.photo ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAp3BkeCN4Ob2TbvINS9OiWR-h28Mm_1YCP3t3UzUChVENbVCfx5_KWm83aoujbIXC1-OYEyUTosshLx8WAkP9Q6VEN7AWd7sbTdfwd3zIme-GjggGm3RtI44dLDX3ANMILnNss3fxV-bk_kG0k0ddfLaVcQOT9jOseqeFAprZNTHhtlVIYTFBvWEwPQR6UkiPWi1sikZ02EvmlmkwQPCVDOnUxVzHDvTluBL_ZzNKnpfMoUCObsMPlL8nS-aO0GGxEZdQTdxERfRM'

  return (
    <div className="flex min-h-screen w-full bg-[#0e1512] text-[#dde4df] font-sans absolute top-0 left-0 z-50">
      <aside className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 border-r border-[#3e4941] bg-[#161d1a] w-64 z-50">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-lg bg-[#72db9f] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#003920]">terminal</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#72db9f]">CodeLab</h1>
            <p className="text-xs text-[#bdcabe]">Curso de Algoritmos</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <button className="w-full flex items-center gap-3 bg-[#3c4a43] text-[#aab9b0] rounded-lg px-4 py-2 text-left font-semibold text-sm">
            <span className="material-symbols-outlined">map</span>
            Minha Trilha
          </button>
          <button
            onClick={() => (window.location.href = '/perfil')}
            className="w-full flex items-center gap-3 text-[#bdcabe] hover:text-[#dde4df] px-4 py-2 hover:bg-[#2f3633] rounded-lg text-left font-semibold text-sm transition-all"
          >
            <span className="material-symbols-outlined">account_circle</span>
            Meu Perfil
          </button>
        </nav>
        <div className="mt-auto pt-4 border-t border-[#3e4941]/30">
          <div className="px-2 mb-4">
             <p className="text-[10px] text-[#bdcabe] uppercase tracking-widest mb-1">Progresso Total</p>
             <div className="w-full bg-[#2f3633] h-2 rounded-full overflow-hidden">
                <div className="bg-[#72db9f] h-full transition-all duration-1000" style={{ width: `${overallProgress}%` }}></div>
             </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#93000a]/20 text-[#ffdad6] hover:bg-[#93000a]/40 border border-[#93000a]/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 flex flex-col relative min-h-screen">
        <header className="sticky top-0 z-40 w-full flex justify-between items-center h-16 px-6 bg-[#0e1512]/80 backdrop-blur-md border-b border-[#3e4941]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-[#1a211e] px-3 py-1 rounded-full border border-[#3e4941]">
              <span className="material-symbols-outlined text-orange-500">local_fire_department</span>
              <span className="text-md font-bold text-[#dde4df]">{user.userStreak}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#1a211e] px-3 py-1 rounded-full border border-[#3e4941]">
              <span className="material-symbols-outlined text-yellow-500">stars</span>
              <span className="text-md font-bold text-[#dde4df]">{Math.floor(user.userPoints)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-[#dde4df]">{user.name}</p>
               <p className="text-[10px] text-[#72db9f] uppercase tracking-tighter">Nível {Math.floor(user.userPoints / 100) + 1}</p>
            </div>
            <button
              onClick={() => (window.location.href = '/perfil')}
              className="w-10 h-10 rounded-full border-2 border-[#72db9f] p-0.5 overflow-hidden transition-transform hover:scale-105"
            >
              <img alt="Profile" className="w-full h-full rounded-full object-cover" src={photoUrl} />
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-4xl mx-auto w-full py-12 px-6">
          <div className="relative flex flex-col items-center gap-12">
            
            <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-full pointer-events-none opacity-20" preserveAspectRatio="none">
               <path
                  className="stroke-[#72db9f] stroke-[4] fill-none"
                  style={{ strokeDasharray: '12 12' }}
                  d={`M 96,0 ${allLessons.map((_, i) => `C ${i % 2 === 0 ? 180 : 20},${i * 100 + 50} ${i % 2 === 0 ? 20 : 180},${i * 100 + 50} 96,${(i + 1) * 100}`).join(' ')}`}
                />
            </svg>

            {allLessons.map((lesson, index) => {
              const meta = TOPIC_METADATA[lesson.unitName] || { label: lesson.unitName, icon: 'help' }
              const isLocked = lesson.status === 'LOCKED'
              const isCompleted = lesson.status === 'COMPLETED'

              const xOffsets = ['translate-x-0', 'translate-x-16', 'translate-x-28', 'translate-x-16', 'translate-x-0', '-translate-x-16', '-translate-x-28', '-translate-x-16']
              const xOffset = xOffsets[index % xOffsets.length]

              return (
                <div key={`${lesson.unitName}-${lesson.lessonNumber}`} className={`relative flex flex-col items-center ${xOffset}`}>
                  
                  {lesson.isFirstInUnit && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                       <span className="bg-[#1a211e] border border-[#72db9f]/30 text-[#72db9f] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                         {meta.label}
                       </span>
                    </div>
                  )}

                  <button
                    disabled={isLocked}
                    onClick={() => handleNavigateToPlayground(lesson.unitName)}
                    title={`Lição ${lesson.lessonNumber} de ${meta.label}`}
                    className={`
                      relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transform transition-all focus:outline-none
                      ${isLocked ? 'bg-[#161d1a] border-4 border-[#2f3633] text-[#4a5750] cursor-not-allowed' : 
                        isCompleted ? 'bg-[#72db9f] text-[#003920] border-4 border-[#003920]/20 hover:scale-110' : 
                        'bg-[#37a36c] text-[#dde4df] border-4 border-[#72db9f] hover:scale-110 shadow-[0_0_20px_rgba(114,219,159,0.4)] animate-[pulse_2s_infinite]'}
                    `}
                  >
                    <span className="material-symbols-outlined text-[28px]">
                      {isLocked ? 'lock' : (isCompleted ? 'check' : meta.icon)}
                    </span>

                    <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                      ${isLocked ? 'bg-[#1a211e] border-[#2f3633] text-[#4a5750]' : 'bg-[#0e1512] border-[#72db9f] text-[#72db9f]'}
                    `}>
                      {lesson.lessonNumber}
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
