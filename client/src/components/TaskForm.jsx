function TaskForm({ task, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="panel task-form" onSubmit={onSubmit}>
      <h2>Create a task</h2>

      <label>
        Task title
        <input
          value={task.title}
          onChange={(event) => onChange({ ...task, title: event.target.value })}
          required
        />
      </label>

      <label>
        Rough notes
        <textarea
          rows="7"
          value={task.rawNotes}
          onChange={(event) => onChange({ ...task, rawNotes: event.target.value })}
          placeholder="Add bullets, reminders, decisions, outcomes and anything else you want AI to organise."
          required
        />
      </label>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Creating…' : 'Save task'}
        </button>
        <button className="secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default TaskForm
