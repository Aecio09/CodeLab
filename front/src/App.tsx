import { useMemo } from 'react'
import { BackgroundDecor } from './components/BackgroundDecor'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { AdminQuestionsPage } from './pages/AdminQuestionsPage'
import { AdminPlaygroundPage } from './pages/AdminPlaygroundPage'
import { StudentPlaygroundPage } from './pages/StudentPlaygroundPage'
import { GeneralPlaygroundPage } from './pages/GeneralPlaygroundPage'
import { StudentPathPage } from './pages/StudentPathPage'

export default function App() {
  const currentPath = window.location.pathname
  const isRegisterPage = currentPath === '/register'
  const isProfilePage = currentPath === '/perfil'
  const isAdminQuestionsPage = currentPath === '/admin/questions'
  const isStudentPathPage = currentPath === '/trilha'
  const isGeneralPlaygroundPage = currentPath === '/playground'

  const adminPlaygroundMatch = currentPath.match(/^\/admin\/questions\/(\d+)\/playground$/)
  const playgroundQuestionId = adminPlaygroundMatch ? Number(adminPlaygroundMatch[1]) : null

  const studentPlaygroundMatch = currentPath.match(/^\/playground\/(\d+)$/)
  const studentQuestionId = studentPlaygroundMatch ? Number(studentPlaygroundMatch[1]) : null

  const registered = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('registered') === '1'
  }, [])

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col antialiased">
      {isRegisterPage ? (
        <RegisterPage />
      ) : isGeneralPlaygroundPage ? (
        <GeneralPlaygroundPage />
      ) : studentQuestionId ? (
        <StudentPlaygroundPage questionId={studentQuestionId} />
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
