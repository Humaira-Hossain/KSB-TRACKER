import StatusBadge from './StatusBadge'

function SuggestionGroup({ title, type, evidence, items, saving, onReview }) {
  return (
    <div className="suggestion-group">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p>No suggestions.</p>
      ) : (
        items.map((item) => (
          <div className="suggestion" key={item.id}>
            <div>
              <strong>{item.code}</strong>
              {item.description && <p className="suggestion-description">{item.description}</p>}
              {item.rationale && <p>{item.rationale}</p>}
              {item.confidence !== undefined && (
                <small>AI confidence: {Math.round(Number(item.confidence) * 100)}%</small>
              )}
            </div>

            {item.reviewStatus === 'suggested' ? (
              <div className="review-actions">
                <button
                  type="button"
                  onClick={() => onReview(evidence, type, item, 'accepted')}
                  disabled={saving}
                >
                  Accept
                </button>
                <button
                  className="reject"
                  type="button"
                  onClick={() => onReview(evidence, type, item, 'rejected')}
                  disabled={saving}
                >
                  Reject
                </button>
              </div>
            ) : (
              <StatusBadge status={item.reviewStatus} />
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default SuggestionGroup
