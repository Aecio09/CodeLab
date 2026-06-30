import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { API_BASE_URL, DIFFICULTY_OPTIONS, TOPIC_OPTIONS, TYPE_OPTIONS } from '../constants'
import { difficultyLabel, resolvePhotoUrl, topicLabel, typeLabel } from '../utils'
import type { QuestionItem, QuestionPayload, QuestionSeedImportResponse, UserProfile } from '../types'

export function AdminQuestionsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState<'ALL' | QuestionItem['topic']>('ALL')
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | QuestionItem['difficulty']>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | QuestionItem['type']>('ALL')
  const [form, setForm] = useState<QuestionPayload>({
    questionBody: '',
    type: 'PRACTICAL',
    difficulty: 'EASY',
    requiredUsage: null,
    topic: 'LACOS',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const editFormRef = useRef<HTMLDivElement | null>(null)

  const loadQuestions = async () => {
    const questionsResponse = await fetch(`${API_BASE_URL}/questions`, {
      credentials: 'include',
    })

    if (!questionsResponse.ok) {
      throw new Error('load-questions')
    }

    const data = (await questionsResponse.json()) as QuestionItem[]
    setQuestions(data)
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const meResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
          credentials: 'include',
        })

        if (!meResponse.ok) {
          window.location.href = '/'
          return
        }

        const me = (await meResponse.json()) as UserProfile
        if (cancelled) return
        setProfile(me)

        if (me.role !== 'ADMIN') {
          window.location.href = '/perfil'
          return
        }

        await loadQuestions()
        if (cancelled) return
      } catch {
        if (!cancelled) setError('Não foi possível carregar as questões.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch =
        search.trim() === '' ||
        question.questionBody.toLowerCase().includes(search.toLowerCase()) ||
        question.topic.toLowerCase().includes(search.toLowerCase())
      const matchesTopic = topicFilter === 'ALL' || question.topic === topicFilter
      const matchesDifficulty = difficultyFilter === 'ALL' || question.difficulty === difficultyFilter
      const matchesType = typeFilter === 'ALL' || question.type === typeFilter
      return matchesSearch && matchesTopic && matchesDifficulty && matchesType
    })
  }, [difficultyFilter, questions, search, topicFilter, typeFilter])

  const avgDifficulty = useMemo(() => {
    if (questions.length === 0) return '-'
    const score = questions.reduce((acc, question) => {
      if (question.difficulty === 'EASY') return acc + 1
      if (question.difficulty === 'MEDIUM') return acc + 2
      return acc + 3
    }, 0)
    const avg = score / questions.length
    if (avg < 1.7) return 'Fácil'
    if (avg < 2.4) return 'Médio'
    return 'Difícil'
  }, [questions])

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

  const handleEdit = (question: QuestionItem) => {
    setSelectedQuestion(question)
    setForm({
      questionBody: question.questionBody,
      type: question.type,
      difficulty: question.difficulty,
      requiredUsage: question.requiredUsage,
      topic: question.topic,
    })
    setSuccess('')
    setError('')
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const handleNewQuestion = () => {
    setSelectedQuestion(null)
    setForm({
      questionBody: '',
      type: 'PRACTICAL',
      difficulty: 'EASY',
      requiredUsage: null,
      topic: 'LACOS',
    })
    setSuccess('')
    setError('')
  }

  const handleUploadQuestionsClick = () => {
    uploadInputRef.current?.click()
  }

  const handleUploadQuestionsFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/questions/import-upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        setError('Não foi possível importar o arquivo de questões.')
        return
      }

      const result = (await response.json()) as QuestionSeedImportResponse
      await loadQuestions()
      setSuccess(
        `Importação concluída: ${result.extractedQuestions} extraídas, ${result.insertedQuestions} inseridas (seed total: ${result.seedQuestionsTotal}).`,
      )
    } catch {
      setError('Não foi possível conectar ao servidor para importar questões.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleSaveQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload: QuestionPayload = {
      questionBody: form.questionBody,
      type: form.type,
      difficulty: form.difficulty,
      topic: form.topic,
      requiredUsage: form.requiredUsage && form.requiredUsage.trim() ? form.requiredUsage.trim().toUpperCase() : null,
    }

    try {
      const url = selectedQuestion ? `${API_BASE_URL}/questions/${selectedQuestion.id}` : `${API_BASE_URL}/questions`
      const method = selectedQuestion ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        setError('Não foi possível salvar a questão.')
        setSaving(false)
        return
      }

      const savedQuestion = (await response.json()) as QuestionItem
      if (selectedQuestion) {
        setQuestions((prev) => prev.map((item) => (item.id === savedQuestion.id ? savedQuestion : item)))
      } else {
        setQuestions((prev) => [savedQuestion, ...prev])
      }

      setSelectedQuestion(savedQuestion)
      setSuccess(selectedQuestion ? 'Questão atualizada com sucesso.' : 'Questão criada com sucesso.')
    } catch {
      setError('Não foi possível conectar ao servidor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <aside className="fixed left-0 top-0 h-full flex flex-col py-lg px-md border-r border-outline-variant bg-surface-container-low w-64 z-40">
        <div className="flex items-center gap-md px-md mb-xl">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined">terminal</span>
          </div>
<div>
            <h1 className="text-lg font-h2 font-bold text-primary tracking-tight">CodeLab</h1>
            <p className="font-label text-label text-on-surface-variant tracking-wider uppercase">Portal de Gerenciamento</p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-xs">
          <a className="flex items-center gap-md text-on-surface-variant hover:text-on-surface px-md py-sm hover:bg-surface-container-highest rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label text-label text-on-surface-variant uppercase tracking-wider">Dashboard</span>
          </a>
          <a className="flex items-center gap-md bg-secondary-container text-on-secondary-container rounded-lg px-md py-sm scale-[0.98] transition-all" href="/admin/questions">
            <span className="material-symbols-outlined">terminal</span>
            <span className="font-label text-label text-on-surface-variant uppercase tracking-wider">Questões</span>
          </a>
        </nav>
        <div className="mt-auto px-md space-y-sm">
          <input
            ref={uploadInputRef}
            type="file"
            accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleUploadQuestionsFile}
          />
          <button
            type="button"
            className="btn-primary w-full !h-10"
            onClick={handleUploadQuestionsClick}
            disabled={uploading || loading}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Importar Questões</span>
          </button>
          <button
            type="button"
            className="btn-secondary w-full !h-10"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="ml-64 flex flex-col min-h-screen">
        <header className="flex justify-between items-center h-16 px-gutter w-full sticky top-0 z-30 bg-surface border-b border-outline-variant">
          <h2 className="font-h2 text-h2 font-bold text-primary">Gerenciador de Questões</h2>
          <div className="flex items-center gap-md">
            <div className="text-right">
              <p className="text-body-sm text-on-surface">{profile?.name ?? 'Administrador'}</p>
              <p className="text-label text-on-surface-variant">{profile?.email ?? ''}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant">
              <img alt="Admin profile" className="w-full h-full object-cover" src={resolvePhotoUrl(profile?.photo ?? null)} />
            </div>
          </div>
        </header>

        <div className="p-gutter flex flex-col gap-lg max-w-container-max mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
            <div className="bg-surface-container border border-outline-variant p-lg rounded-xl flex flex-col gap-xs">
              <span className="font-label text-label text-on-surface-variant">Total Questions</span>
              <span className="font-h1 text-h1 text-primary">{questions.length}</span>
            </div>
            <div className="bg-surface-container border border-outline-variant p-lg rounded-xl flex flex-col gap-xs">
              <span className="font-label text-label text-on-surface-variant">Filtradas</span>
              <span className="font-h1 text-h1 text-primary">{filteredQuestions.length}</span>
            </div>
            <div className="bg-surface-container border border-outline-variant p-lg rounded-xl flex flex-col gap-xs">
              <span className="font-label text-label text-on-surface-variant">Avg. Difficulty</span>
              <span className="font-h1 text-h1 text-tertiary">{avgDifficulty}</span>
            </div>
            <div className="bg-surface-container border border-outline-variant p-lg rounded-xl flex flex-col gap-xs">
              <span className="font-label text-label text-on-surface-variant">Status</span>
              <span className="font-h1 text-h1 text-primary">{loading ? 'Carregando' : 'Online'}</span>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-lg border-b border-outline-variant flex flex-col lg:flex-row gap-md lg:items-center lg:justify-between">
              <h3 className="font-h3 text-h3 text-on-surface">Question Bank</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-sm w-full lg:w-auto">
                <input
                  className="input-field !h-10"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select
                  className="select-field !h-10"
                  value={topicFilter}
                  onChange={(event) => setTopicFilter(event.target.value as 'ALL' | QuestionItem['topic'])}
                >
                  <option value="ALL">Todos os tópicos</option>
                  {TOPIC_OPTIONS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topicLabel(topic)}
                    </option>
                  ))}
                </select>
                <select
                  className="select-field !h-10"
                  value={difficultyFilter}
                  onChange={(event) => setDifficultyFilter(event.target.value as 'ALL' | QuestionItem['difficulty'])}
                >
                  <option value="ALL">Todas as dificuldades</option>
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficultyLabel(difficulty)}
                    </option>
                  ))}
                </select>
                <select
                  className="select-field !h-10"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as 'ALL' | QuestionItem['type'])}
                >
                  <option value="ALL">Todos os tipos</option>
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {typeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant">
                    <th className="px-lg py-md font-label text-label text-on-surface-variant uppercase tracking-wider">ID</th>
                    <th className="px-lg py-md font-label text-label text-on-surface-variant uppercase tracking-wider">Enunciado</th>
                    <th className="px-lg py-md font-label text-label text-on-surface-variant uppercase tracking-wider">Tópico</th>
                    <th className="px-lg py-md font-label text-label text-on-surface-variant uppercase tracking-wider">Dificuldade</th>
                    <th className="px-lg py-md font-label text-label text-on-surface-variant uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filteredQuestions.map((question) => (
                    <tr
                      key={question.id}
                      className={`hover:bg-surface-container-highest transition-colors duration-150 group ${
                        selectedQuestion?.id === question.id ? 'bg-surface-container-highest' : ''
                      }`}
                    >
                      <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">#{question.id}</td>
                      <td className="px-lg py-md">
                        <div className="max-w-xl">
                          <p className="font-body-md text-body-md text-on-surface line-clamp-2">{question.questionBody}</p>
                          <p className="font-label text-label text-on-surface-variant">{typeLabel(question.type)}</p>
                        </div>
                      </td>
                      <td className="px-lg py-md">
                        <span className="bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full font-label text-[10px] uppercase">
                          {topicLabel(question.topic)}
                        </span>
                      </td>
                      <td className="px-lg py-md">
                        <span className="font-label text-label">{difficultyLabel(question.difficulty)}</span>
                      </td>
                      <td className="px-lg py-md text-right">
                        <div className="flex items-center justify-end gap-xs">
                          <button
                            type="button"
                            className="p-xs text-on-surface-variant hover:text-primary transition-colors"
                            title="Abrir playground"
                            onClick={() => {
                              window.location.href = `/admin/questions/${question.id}/playground`
                            }}
                          >
                            <span className="material-symbols-outlined">terminal</span>
                          </button>
                          <button
                            type="button"
                            className="p-xs text-on-surface-variant hover:text-primary transition-colors"
                            onClick={() => handleEdit(question)}
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredQuestions.length === 0 ? (
                    <tr>
                      <td className="px-lg py-lg text-on-surface-variant" colSpan={5}>
                        Nenhuma questão encontrada para os filtros aplicados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div ref={editFormRef} className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <h3 className="font-h3 text-h3 text-on-surface mb-md">{selectedQuestion ? `Editar Questão #${selectedQuestion.id}` : 'Nova Questão'}</h3>
            {error ? <p className="text-error text-body-sm mb-sm">{error}</p> : null}
            {success ? <p className="text-primary text-body-sm mb-sm">{success}</p> : null}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-md" onSubmit={handleSaveQuestion}>
              <div className="md:col-span-2">
                <label className="form-label" htmlFor="questionBody">
                  Enunciado
                </label>
                <textarea
                  id="questionBody"
                  className="textarea-field min-h-28"
                  value={form.questionBody}
                  onChange={(event) => setForm((prev) => ({ ...prev, questionBody: event.target.value }))}
                  required
                  maxLength={3000}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="type">
                  Tipo
                </label>
                <select
                  id="type"
                  className="select-field"
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as QuestionItem['type'] }))}
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {typeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="difficulty">
                  Dificuldade
                </label>
                <select
                  id="difficulty"
                  className="select-field"
                  value={form.difficulty}
                  onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value as QuestionItem['difficulty'] }))}
                >
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficultyLabel(difficulty)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="topic">
                  Tópico
                </label>
                <select
                  id="topic"
                  className="select-field"
                  value={form.topic}
                  onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value as QuestionItem['topic'] }))}
                >
                  {TOPIC_OPTIONS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topicLabel(topic)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
<label className="form-label" htmlFor="requiredUsage">
                   Uso Obrigatório (opcional)
                </label>
                <input
                  id="requiredUsage"
                  className="input-field"
                  placeholder="ex: FOR, IF, ARRAY_MAP"
                  value={form.requiredUsage ?? ''}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      requiredUsage: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="md:col-span-2 flex gap-sm">
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={saving || loading}
                >
                  {saving ? 'Salvando...' : selectedQuestion ? 'Salvar alteração' : 'Criar questão'}
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={handleNewQuestion}
                >
                  {selectedQuestion ? 'Cancelar edição' : 'Limpar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}
