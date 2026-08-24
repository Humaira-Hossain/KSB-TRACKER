import TaskForm from '../components/TaskForm'

function CreateTaskPage({ taskForm, saving, error, onBack, onTaskFormChange, onCreateTask }) {
  return (
    <main className="app-shell">
      <button className="text-button" type="button" onClick={onBack}>
        ← Dashboard
      </button>

      <section className="page-heading">
        <div>
          <p className="eyebrow">New task</p>
          <h1>Create a task</h1>
          <p>Capture rough notes first. You can turn them into STAR evidence afterwards.</p>
        </div>
      </section>

      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}

      <TaskForm
        task={taskForm}
        saving={saving}
        onChange={onTaskFormChange}
        onSubmit={onCreateTask}
        onCancel={onBack}
      />
    </main>
  )
}

export default CreateTaskPage
