import StatusBadge from './StatusBadge'

function TaskCards({ tasks, onSelect }) {
  return tasks.map((task) => (
    <button className="task-card" type="button" key={task.id} onClick={() => onSelect(task.id)}>
      <span>
        <strong>{task.title}</strong>
        <small>
          {task.evidence_count} evidence item{Number(task.evidence_count) === 1 ? '' : 's'}
        </small>
      </span>
      <StatusBadge status={task.status} />
    </button>
  ))
}

function TaskList({ tasks, onSelect }) {
  if (tasks.length === 0) {
    return <div className="empty-state">No tasks yet. Create your first task to begin.</div>
  }

  const activeTasks = tasks.filter((task) => task.status !== 'archived')
  const archivedTasks = tasks.filter((task) => task.status === 'archived')

  return (
    <div className="task-list-groups">
      {activeTasks.length > 0 && (
        <section className="task-list" aria-label="Tasks">
          <TaskCards tasks={activeTasks} onSelect={onSelect} />
        </section>
      )}

      {archivedTasks.length > 0 && (
        <section className="archived-tasks">
          <h2>Archived</h2>
          <section className="task-list" aria-label="Archived tasks">
            <TaskCards tasks={archivedTasks} onSelect={onSelect} />
          </section>
        </section>
      )}
    </div>
  )
}

export default TaskList
