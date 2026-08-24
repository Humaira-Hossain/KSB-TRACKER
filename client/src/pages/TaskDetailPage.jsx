import EvidenceEditor from '../components/EvidenceEditor'
import StatusBadge from '../components/StatusBadge'

function TaskDetailPage({ task, saving, error, notice, onBack, onCreateEvidence, onSaveEvidence, onGenerateEvidence, onReviewSuggestion }) {
  const generationLocked = task.evidence.some((evidence) => evidence.ai_generated)

  return (
    <main className="app-shell">
      <button className="text-button" onClick={onBack} type="button">← All tasks</button>

      <section className="page-heading">
        <div>
          <p className="eyebrow">Task evidence</p>
          <h1>{task.title}</h1>
        </div>
        <StatusBadge status={task.status} />
      </section>

      {error && <p className="message error" role="alert">{error}</p>}
      {notice && <p className="message success">{notice}</p>}

      <section className="panel task-notes">
        <h2>Rough notes</h2>
        <p>{task.rawNotes}</p>
      </section>

      <section className="evidence-header">
        <div>
          <h2>Evidence</h2>
          <p>Create evidence from your task notes, then review the STAR response.</p>
        </div>
        <button type="button" onClick={onCreateEvidence} disabled={saving}>Create evidence</button>
      </section>

      {task.evidence.length === 0 && (
        <section className="empty-state">No evidence yet. Create an evidence item to start the STAR workflow.</section>
      )}

      <div className="evidence-list">
        {task.evidence.map((evidence) => (
          <EvidenceEditor
            key={`${evidence.id}-${evidence.updated_at}-${evidence.status}`}
            evidence={evidence}
            saving={saving}
            generationLocked={generationLocked}
            onSave={onSaveEvidence}
            onGenerate={onGenerateEvidence}
            onReview={onReviewSuggestion}
          />
        ))}
      </div>
    </main>
  )
}

export default TaskDetailPage
