import StatusBadge from './StatusBadge'

function TaskList({ tasks, onSelect }) {
  if (tasks.length === 0) {
    return <div className="empty-state">No tasks yet. Create your first task to begin.</div>
  }

  return (
    <section className="task-list" aria-label="Tasks">
      {tasks.map((task) => (
        <button className="task-card" type="button" key={task.id} onClick={() => onSelect(task.id)}>
          <span>
            <strong>{task.title}</strong>
            <small>
              {task.evidence_count} evidence item{Number(task.evidence_count) === 1 ? '' : 's'}
            </small>
          </span>
          <StatusBadge status={task.status} />
        </button>
      ))}
    </section>
  )
}

export default TaskList
