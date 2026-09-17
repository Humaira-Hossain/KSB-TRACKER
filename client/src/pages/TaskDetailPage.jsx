import EvidenceEditor from '../components/EvidenceEditor'
import StatusBadge from '../components/StatusBadge'
import TaskCompletionSummary from '../components/TaskCompletionSummary'
import TaskNotesEditor from '../components/TaskNotesEditor'

function TaskDetailPage({
  task,
  catalogue,
  saving,
  error,
  notice,
  onBack,
  onArchiveTask,
  onCompleteTask,
  onUnarchiveTask,
  onSaveRawNotes,
  onCreateEvidence,
  onSaveEvidence,
  onGenerateEvidence,
  onReviewSuggestion,
  onAddManualLink,
  onDeleteEvidence,
  onApproveEvidence,
  onReopenTask,
}) {
  const generationLocked = task.evidence.some((evidence) => evidence.ai_generated)
  const readOnly = task.status === 'completed'

  return (
    <main className="app-shell">
      <button className="text-button" onClick={onBack} type="button">
        ← All tasks
      </button>

      <section className="page-heading">
        <div>
          <p className="eyebrow">Task evidence</p>
          <h1>{task.title}</h1>
        </div>
        <div className="task-detail-actions">
          <StatusBadge status={task.status} />
          {task.status !== 'archived' && (
            <button className="reject" type="button" onClick={onArchiveTask} disabled={saving}>
              Archive task
            </button>
          )}
          {task.status === 'archived' && (
            <button className="secondary" type="button" onClick={onUnarchiveTask} disabled={saving}>
              Unarchive task
            </button>
          )}
          {readOnly && (
            <button className="secondary" type="button" onClick={onReopenTask} disabled={saving}>
              Reopen task
            </button>
          )}
        </div>
      </section>

      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}
      {notice && <p className="message success">{notice}</p>}

      <TaskNotesEditor
        key={`${task.id}-${task.rawNotes}`}
        rawNotes={task.rawNotes}
        saving={saving}
        readOnly={readOnly}
        onSave={onSaveRawNotes}
      />

      {task.status !== 'completed' && task.status !== 'archived' && (
        <TaskCompletionSummary
          evidence={task.evidence}
          saving={saving}
          onComplete={onCompleteTask}
        />
      )}

      <section className="evidence-header">
        <div>
          <h2>Evidence</h2>
          <p>Create evidence from your task notes, then review the STAR response.</p>
        </div>
        <button type="button" onClick={onCreateEvidence} disabled={saving || readOnly}>
          Create evidence
        </button>
      </section>

      {task.evidence.length === 0 && (
        <section className="empty-state">
          No evidence yet. Create an evidence item to start the STAR workflow.
        </section>
      )}

      <div className="evidence-list">
        {task.evidence.map((evidence) => (
          <EvidenceEditor
            key={`${evidence.id}-${evidence.updated_at}-${evidence.status}`}
            evidence={evidence}
            catalogue={catalogue}
            saving={saving}
            generationLocked={generationLocked}
            onSave={onSaveEvidence}
            onGenerate={onGenerateEvidence}
            onReview={onReviewSuggestion}
            onAddManualLink={onAddManualLink}
            onDelete={onDeleteEvidence}
            onApprove={onApproveEvidence}
            readOnly={readOnly}
          />
        ))}
      </div>
    </main>
  )
}

export default TaskDetailPage
