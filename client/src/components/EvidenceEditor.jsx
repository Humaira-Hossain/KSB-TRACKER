import { useState } from 'react'
import StatusBadge from './StatusBadge'
import SuggestionGroup from './SuggestionGroup'

const starFields = ['situation', 'task', 'action', 'result']

function EvidenceEditor({ evidence, saving, generationLocked, onSave, onGenerate, onReview }) {
  const [draft, setDraft] = useState(evidence)

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  return (
    <article className="panel evidence-card">
      <header>
        <div>
          <p className="eyebrow">Evidence</p>
          <StatusBadge status={draft.status} />
        </div>
        {draft.ai_generated && <span className="ai-label">AI-generated STAR</span>}
      </header>

      <label>
        Evidence title
        <input
          value={draft.title || ''}
          onChange={(event) => updateField('title', event.target.value)}
          required
        />
      </label>

      <div className="star-grid">
        {starFields.map((field) => (
          <label key={field}>
            {field}
            <textarea
              rows="4"
              value={draft[field] || ''}
              onChange={(event) => updateField(field, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" onClick={() => onSave(draft)} disabled={saving}>
          Save evidence
        </button>
        <button
          className="secondary"
          type="button"
          onClick={() => onGenerate(draft)}
          disabled={saving || !draft.rawNotes || generationLocked}
        >
          {saving ? 'Working…' : 'Generate STAR'}
        </button>
      </div>

      {!draft.rawNotes && (
        <p className="field-hint">This evidence needs rough notes before STAR can be generated.</p>
      )}
      {generationLocked && (
        <p className="field-hint">
          STAR has already been generated for this task. You can still edit and save the existing
          evidence.
        </p>
      )}

      {(draft.ksbs.length > 0 || draft.acceptanceCriteria.length > 0) && (
        <section className="suggestions">
          <h3>AI suggestions</h3>
          <SuggestionGroup
            title="KSBs"
            type="ksb"
            evidence={draft}
            items={draft.ksbs}
            saving={saving}
            onReview={onReview}
          />
          <SuggestionGroup
            title="Acceptance criteria"
            type="ac"
            evidence={draft}
            items={draft.acceptanceCriteria}
            saving={saving}
            onReview={onReview}
          />
        </section>
      )}
    </article>
  )
}

export default EvidenceEditor
