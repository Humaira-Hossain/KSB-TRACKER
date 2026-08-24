import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import CreateTaskPage from './pages/CreateTaskPage'
import DashboardPage from './pages/DashboardPage'
import AcceptanceCriteriaPage from './pages/AcceptanceCriteriaPage'
import KsbDetailPage from './pages/KsbDetailPage'
import TaskDetailPage from './pages/TaskDetailPage'
import TaskListPage from './pages/TaskListPage'
import { getCatalogue } from './services/catalogue'
import {
  createEvidence,
  generateEvidence,
  reviewAcceptanceCriterionSuggestion,
  reviewKsbSuggestion,
  updateEvidence,
} from './services/evidence'
import { getProgress } from './services/progress'
import { getAcceptanceCriteriaWithReferences } from './services/acceptanceCriteria'
import { getKsbsWithReferences } from './services/ksbs'
import { createTask, getTask, getTasks } from './services/tasks'
import './App.css'

const blankTask = { title: '', rawNotes: '' }

function normaliseEvidence(evidence) {
  return {
    ...evidence,
    rawNotes: evidence.rawNotes ?? evidence.raw_notes ?? '',
    ksbs: evidence.ksbs ?? [],
    acceptanceCriteria: evidence.acceptanceCriteria ?? [],
  }
}

function normaliseTask(task) {
  return {
    ...task,
    rawNotes: task.rawNotes ?? task.raw_notes ?? '',
    evidence: (task.evidence ?? []).map(normaliseEvidence),
  }
}

function TaskDetailRoute({ task, loading, error, ...pageProps }) {
  const { taskId } = useParams()

  if (!task || String(task.id) !== taskId) {
    return (
      <main className="app-shell">
        {error ? (
          <p className="message error" role="alert">
            {error}
          </p>
        ) : (
          <p className="loading">{loading ? 'Loading task…' : 'Task not found.'}</p>
        )}
      </main>
    )
  }

  return <TaskDetailPage task={task} error={error} {...pageProps} />
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [catalogue, setCatalogue] = useState({ ksbs: [], acceptanceCriteria: [] })
  const [progress, setProgress] = useState(null)
  const [ksbs, setKsbs] = useState([])
  const [acceptanceCriteria, setAcceptanceCriteria] = useState([])
  const [taskForm, setTaskForm] = useState(blankTask)
  const [loading, setLoading] = useState(true)
  const [ksbLoading, setKsbLoading] = useState(false)
  const [acceptanceCriteriaLoading, setAcceptanceCriteriaLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadTask = useCallback(async (taskId) => {
    setLoading(true)
    setError('')
    setNotice('')

    try {
      setSelectedTask(normaliseTask(await getTask(taskId)))
    } catch (requestError) {
      setSelectedTask(null)
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  async function loadInitialData() {
    setLoading(true)
    setError('')

    try {
      const [taskList, loadedCatalogue, progressResult] = await Promise.all([
        getTasks(),
        getCatalogue(),
        getProgress(),
      ])
      setTasks(taskList)
      setCatalogue(loadedCatalogue)
      setProgress(progressResult)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadTasks() {
    setTasks(await getTasks())
  }

  const loadKsbs = useCallback(async () => {
    setKsbLoading(true)
    setError('')

    try {
      setKsbs(await getKsbsWithReferences())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setKsbLoading(false)
    }
  }, [])

  const loadAcceptanceCriteria = useCallback(async () => {
    setAcceptanceCriteriaLoading(true)
    setError('')

    try {
      setAcceptanceCriteria(await getAcceptanceCriteriaWithReferences())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setAcceptanceCriteriaLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadInitialData)
  }, [])

  useEffect(() => {
    const taskPath = location.pathname.match(/^\/tasks\/(\d+)$/)
    if (taskPath && String(selectedTask?.id) !== taskPath[1]) {
      void Promise.resolve().then(() => loadTask(taskPath[1]))
    }
  }, [location.pathname, loadTask, selectedTask?.id])

  useEffect(() => {
    if (location.pathname === '/ksbs') {
      void Promise.resolve().then(loadKsbs)
    }
    if (location.pathname === '/acceptance-criteria') {
      void Promise.resolve().then(loadAcceptanceCriteria)
    }
  }, [location.pathname, loadAcceptanceCriteria, loadKsbs])

  async function handleCreateTask(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const task = await createTask(taskForm)
      setTaskForm(blankTask)
      await loadTasks()
      navigate(`/tasks/${task.id}`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  function replaceEvidence(updatedEvidence) {
    const nextEvidence = normaliseEvidence(updatedEvidence)
    const includesKsbs = Object.hasOwn(updatedEvidence, 'ksbs')
    const includesAcceptanceCriteria = Object.hasOwn(updatedEvidence, 'acceptanceCriteria')

    setSelectedTask((task) => ({
      ...task,
      evidence: task.evidence.map((item) =>
        String(item.id) === String(nextEvidence.id)
          ? {
              ...item,
              ...nextEvidence,
              ksbs: includesKsbs ? nextEvidence.ksbs : item.ksbs,
              acceptanceCriteria: includesAcceptanceCriteria
                ? nextEvidence.acceptanceCriteria
                : item.acceptanceCriteria,
            }
          : item,
      ),
    }))
  }

  async function handleCreateEvidence() {
    setSaving(true)
    setError('')

    try {
      const evidence = await createEvidence(selectedTask.id, {
        title: `Evidence: ${selectedTask.title}`,
        rawNotes: selectedTask.rawNotes,
      })
      setSelectedTask((task) => ({
        ...task,
        evidence: [normaliseEvidence(evidence), ...task.evidence],
      }))
      setTasks((items) =>
        items.map((item) =>
          String(item.id) === String(selectedTask.id)
            ? { ...item, evidence_count: Number(item.evidence_count) + 1 }
            : item,
        ),
      )
      setNotice('Evidence created. Review its title, then generate STAR when ready.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEvidence(evidence) {
    setSaving(true)
    setError('')

    try {
      const savedEvidence = await updateEvidence(evidence.id, {
        title: evidence.title,
        situation: evidence.situation || null,
        task: evidence.task || null,
        action: evidence.action || null,
        result: evidence.result || null,
      })
      replaceEvidence(savedEvidence)
      setNotice('Evidence saved.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  function attachCatalogueDescription(suggestion, type) {
    const items = type === 'ksb' ? catalogue.ksbs : catalogue.acceptanceCriteria
    const match = items.find((item) => item.code === suggestion.code)

    return {
      ...suggestion,
      id: type === 'ksb' ? suggestion.ksbId : suggestion.acceptanceCriterionId,
      description: match?.description,
    }
  }

  async function handleGenerateEvidence(evidence) {
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const generated = await generateEvidence(evidence.id)
      const nextEvidence = normaliseEvidence(generated.evidence)
      nextEvidence.ksbs = generated.suggestions.ksbs.map((suggestion) =>
        attachCatalogueDescription(suggestion, 'ksb'),
      )
      nextEvidence.acceptanceCriteria = generated.suggestions.acceptanceCriteria.map((suggestion) =>
        attachCatalogueDescription(suggestion, 'ac'),
      )
      replaceEvidence(nextEvidence)
      setNotice('STAR evidence and AI suggestions are ready for your review.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleReviewSuggestion(evidence, type, suggestion, reviewStatus) {
    setSaving(true)
    setError('')

    try {
      if (type === 'ksb') {
        await reviewKsbSuggestion(evidence.id, suggestion.id, reviewStatus)
      } else {
        await reviewAcceptanceCriterionSuggestion(evidence.id, suggestion.id, reviewStatus)
      }

      setSelectedTask((task) => ({
        ...task,
        evidence: task.evidence.map((item) => {
          if (String(item.id) !== String(evidence.id)) return item
          const collection = type === 'ksb' ? 'ksbs' : 'acceptanceCriteria'
          return {
            ...item,
            [collection]: item[collection].map((entry) =>
              String(entry.id) === String(suggestion.id) ? { ...entry, reviewStatus } : entry,
            ),
          }
        }),
      }))
      setNotice(`${suggestion.code} was ${reviewStatus}.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <DashboardPage
            tasks={tasks}
            progress={progress}
            loading={loading}
            error={error}
            onCreateTask={() => navigate('/tasks/new')}
            onViewTasks={() => navigate('/tasks')}
            onViewKsbs={() => navigate('/ksbs')}
            onViewAcceptanceCriteria={() => navigate('/acceptance-criteria')}
          />
        }
      />
      <Route
        path="/ksbs"
        element={<KsbDetailPage ksbs={ksbs} loading={ksbLoading} error={error} />}
      />
      <Route
        path="/acceptance-criteria"
        element={
          <AcceptanceCriteriaPage
            criteria={acceptanceCriteria}
            loading={acceptanceCriteriaLoading}
            error={error}
          />
        }
      />
      <Route
        path="/tasks"
        element={
          <TaskListPage
            tasks={tasks}
            loading={loading}
            error={error}
            onBack={() => navigate('/')}
            onCreateTask={() => navigate('/tasks/new')}
            onSelectTask={(taskId) => navigate(`/tasks/${taskId}`)}
          />
        }
      />
      <Route
        path="/tasks/new"
        element={
          <CreateTaskPage
            taskForm={taskForm}
            saving={saving}
            error={error}
            onBack={() => navigate('/')}
            onTaskFormChange={setTaskForm}
            onCreateTask={handleCreateTask}
          />
        }
      />
      <Route
        path="/tasks/:taskId"
        element={
          <TaskDetailRoute
            task={selectedTask}
            loading={loading}
            error={error}
            saving={saving}
            notice={notice}
            onBack={() => navigate('/tasks')}
            onCreateEvidence={handleCreateEvidence}
            onSaveEvidence={handleSaveEvidence}
            onGenerateEvidence={handleGenerateEvidence}
            onReviewSuggestion={handleReviewSuggestion}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
