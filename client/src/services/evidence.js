import { api } from './api'

export function createEvidence(taskId, evidence) {
  return api(`/tasks/${taskId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(evidence),
  })
}

export function updateEvidence(evidenceId, evidence) {
  return api(`/evidence/${evidenceId}`, {
    method: 'PATCH',
    body: JSON.stringify(evidence),
  })
}

export function generateEvidence(evidenceId) {
  return api(`/evidence/${evidenceId}/generate`, { method: 'POST' })
}

export function reviewKsbSuggestion(evidenceId, ksbId, reviewStatus) {
  return api(`/evidence/${evidenceId}/ksbs/${ksbId}/review`, {
    method: 'PUT',
    body: JSON.stringify({ reviewStatus }),
  })
}

export function reviewAcceptanceCriterionSuggestion(evidenceId, acceptanceCriterionId, reviewStatus) {
  return api(`/evidence/${evidenceId}/acceptance-criteria/${acceptanceCriterionId}/review`, {
    method: 'PUT',
    body: JSON.stringify({ reviewStatus }),
  })
}
