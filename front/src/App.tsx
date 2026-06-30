import { useEffect, useMemo } from 'react'
import { AccessibilityToolbar } from './components/AccessibilityToolbar'
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

  const pageTitle = useMemo(() => {
    if (isRegisterPage) return 'Cadastro'
    if (isGeneralPlaygroundPage) return 'Playground'
    if (studentQuestionId) return 'Desafio'
    if (playgroundQuestionId) return 'Playground - Admin'
    if (isAdminQuestionsPage) return 'Gerenciar Questões'
    if (isProfilePage) return 'Meu Perfil'
    if (isStudentPathPage) return 'Trilha de Aprendizado'
    return 'Login'
  }, [isRegisterPage, isGeneralPlaygroundPage, studentQuestionId, playgroundQuestionId, isAdminQuestionsPage, isProfilePage, isStudentPathPage])

  useEffect(() => {
    document.title = `CodeLab - ${pageTitle}`
  }, [pageTitle])

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col antialiased">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
        Pular para o conteúdo principal
      </a>
      <div id="main-content" className="flex flex-col flex-1">
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
      <AccessibilityToolbar />
      </div>
    </div>
  )
}
