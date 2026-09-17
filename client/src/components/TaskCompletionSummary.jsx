function codesForStatus(evidence, status) {
  const codes = evidence.flatMap((item) => [
    ...(item.ksbs ?? []),
    ...(item.acceptanceCriteria ?? []),
  ])

  return [...new Set(codes.filter((item) => item.reviewStatus === status).map((item) => item.code))]
}

function SummaryLine({ label, codes }) {
  return (
    <p>
      {label}: {codes.length > 0 ? codes.join(', ') : 'None'}
    </p>
  )
}

function TaskCompletionSummary({ evidence, saving, onComplete }) {
  const acceptedKsbs = [
    ...new Set(
      evidence.flatMap((item) =>
        (item.ksbs ?? []).filter((ksb) => ksb.reviewStatus === 'accepted').map((ksb) => ksb.code),
      ),
    ),
  ]
  const acceptedCriteria = [
    ...new Set(
      evidence.flatMap((item) =>
        (item.acceptanceCriteria ?? [])
          .filter((criterion) => criterion.reviewStatus === 'accepted')
          .map((criterion) => criterion.code),
      ),
    ),
  ]

  return (
    <section className="panel completion-summary">
      <h2>Completion review</h2>
      <p>You decide when this task is complete. AI suggestions do not complete it automatically.</p>
      <SummaryLine label="Accepted KSBs" codes={acceptedKsbs} />
      <SummaryLine label="Accepted acceptance criteria" codes={acceptedCriteria} />
      <SummaryLine label="Pending suggestions" codes={codesForStatus(evidence, 'suggested')} />
      <SummaryLine label="Rejected suggestions" codes={codesForStatus(evidence, 'rejected')} />
      <div className="form-actions">
        <button type="button" onClick={onComplete} disabled={saving}>
          {saving ? 'Completing…' : 'Mark task complete'}
        </button>
      </div>
    </section>
  )
}

export default TaskCompletionSummary
