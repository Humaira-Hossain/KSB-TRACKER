import { useState } from 'react'
import StatusBadge from './StatusBadge'
import SuggestionGroup from './SuggestionGroup'

const starFields = ['situation', 'task', 'action', 'result']

function EvidenceEditor({
  evidence,
  catalogue = { ksbs: [], acceptanceCriteria: [] },
  saving,
  generationLocked,
  onSave,
  onGenerate,
  onReview,
  onAddManualLink = () => {},
  onDelete = () => {},
  onApprove = () => {},
  readOnly = false,
}) {
  const [draft, setDraft] = useState(evidence)
  const [selectedKsbId, setSelectedKsbId] = useState('')
  const [selectedAcceptanceCriterionId, setSelectedAcceptanceCriterionId] = useState('')

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function reviewLink(_evidence, type, item, reviewStatus) {
    const wasReviewed = await onReview(draft, type, item, reviewStatus)
    if (!wasReviewed) return

    const collection = type === 'ksb' ? 'ksbs' : 'acceptanceCriteria'
    setDraft((current) => ({
      ...current,
      [collection]: current[collection].map((link) =>
        String(link.id) === String(item.id) ? { ...link, reviewStatus } : link,
      ),
    }))
  }

  async function approve() {
    const approvedEvidence = await onApprove(draft)
    if (approvedEvidence) setDraft((current) => ({ ...current, ...approvedEvidence }))
  }

  async function addManualLink(type, selectedId) {
    const items = type === 'ksb' ? catalogue.ksbs : catalogue.acceptanceCriteria
    const selectedItem = items.find((item) => String(item.id) === selectedId)
    if (!selectedItem) return

    const wasAdded = await onAddManualLink(draft, type, selectedItem)
    if (!wasAdded) return
    const collection = type === 'ksb' ? 'ksbs' : 'acceptanceCriteria'
    setDraft((current) => ({
      ...current,
      [collection]: [
        ...current[collection].filter((item) => String(item.id) !== selectedId),
        { ...selectedItem, reviewStatus: 'accepted', suggestedBy: 'user' },
      ],
    }))

    if (type === 'ksb') setSelectedKsbId('')
    else setSelectedAcceptanceCriterionId('')
  }

  const linkedKsbIds = new Set(draft.ksbs.map((item) => String(item.id)))
  const linkedAcceptanceCriterionIds = new Set(
    draft.acceptanceCriteria.map((item) => String(item.id)),
  )
  const hasPendingSuggestions = [...draft.ksbs, ...draft.acceptanceCriteria].some(
    (item) => item.reviewStatus === 'suggested',
  )

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
          disabled={readOnly}
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
              disabled={readOnly}
            />
          </label>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" onClick={() => onSave(draft)} disabled={saving || readOnly}>
          Save evidence
        </button>
        <button
          className="secondary"
          type="button"
          onClick={() => onGenerate(draft)}
          disabled={saving || readOnly || !draft.rawNotes || generationLocked}
        >
          {saving ? 'Working…' : 'Generate STAR'}
        </button>
        <button
          className="reject"
          type="button"
          onClick={() => onDelete(draft.id)}
          disabled={saving || readOnly}
        >
          Delete evidence
        </button>
        <button
          type="button"
          onClick={approve}
          disabled={saving || readOnly || hasPendingSuggestions || draft.status === 'approved'}
        >
          {draft.status === 'approved' ? 'Evidence approved' : 'Approve evidence'}
        </button>
      </div>

      {hasPendingSuggestions && (
        <p className="field-hint">Review every suggested KSB and acceptance criterion first.</p>
      )}

      {!draft.rawNotes && (
        <p className="field-hint">This evidence needs rough notes before STAR can be generated.</p>
      )}
      {generationLocked && (
        <p className="field-hint">
          STAR has already been generated for this task. You can still edit and save the existing
          evidence.
        </p>
      )}

      <section className="manual-links">
        <h3>Manual links</h3>
        <p>
          Add a KSB or acceptance criterion yourself when it is relevant. Your links are accepted.
        </p>
        <div className="manual-link-controls">
          <label>
            Add KSB
            <select
              value={selectedKsbId}
              onChange={(event) => setSelectedKsbId(event.target.value)}
              disabled={readOnly}
            >
              <option value="">Select a KSB</option>
              {catalogue.ksbs
                .filter((item) => !linkedKsbIds.has(String(item.id)))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.description}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="secondary"
            type="button"
            onClick={() => addManualLink('ksb', selectedKsbId)}
            disabled={saving || readOnly || !selectedKsbId}
          >
            Add KSB
          </button>
        </div>
        <div className="manual-link-controls">
          <label>
            Add acceptance criterion
            <select
              value={selectedAcceptanceCriterionId}
              onChange={(event) => setSelectedAcceptanceCriterionId(event.target.value)}
              disabled={readOnly}
            >
              <option value="">Select an acceptance criterion</option>
              {catalogue.acceptanceCriteria
                .filter((item) => !linkedAcceptanceCriterionIds.has(String(item.id)))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.description}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="secondary"
            type="button"
            onClick={() => addManualLink('ac', selectedAcceptanceCriterionId)}
            disabled={saving || readOnly || !selectedAcceptanceCriterionId}
          >
            Add acceptance criterion
          </button>
        </div>
      </section>

      {(draft.ksbs.length > 0 || draft.acceptanceCriteria.length > 0) && (
        <section className="suggestions">
          <h3>AI suggestions</h3>
          <SuggestionGroup
            title="KSBs"
            type="ksb"
            evidence={draft}
            items={draft.ksbs}
            saving={saving || readOnly}
            onReview={reviewLink}
          />
          <SuggestionGroup
            title="Acceptance criteria"
            type="ac"
            evidence={draft}
            items={draft.acceptanceCriteria}
            saving={saving || readOnly}
            onReview={reviewLink}
          />
        </section>
      )}
    </article>
  )
}

export default EvidenceEditor
