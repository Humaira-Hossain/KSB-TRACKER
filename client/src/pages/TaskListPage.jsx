import TaskList from '../components/TaskList'

function TaskListPage({ tasks, loading, error, onBack, onCreateTask, onSelectTask }) {
  return (
    <main className="app-shell">
      <button className="text-button" type="button" onClick={onBack}>← Dashboard</button>

      <section className="page-heading">
        <div>
          <p className="eyebrow">KSB tracker</p>
          <h1>Your tasks</h1>
          <p>Capture notes, build evidence, then review your STAR response.</p>
        </div>
        <button type="button" onClick={onCreateTask}>Create task</button>
      </section>

      {error && <p className="message error" role="alert">{error}</p>}

      {loading ? <p className="loading">Loading tasks…</p> : <TaskList tasks={tasks} onSelect={onSelectTask} />}
    </main>
  )
}

export default TaskListPage
