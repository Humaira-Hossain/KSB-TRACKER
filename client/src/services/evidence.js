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

export function deleteEvidence(evidenceId) {
  return api(`/evidence/${evidenceId}`, { method: 'DELETE' })
}

export function approveEvidence(evidenceId) {
  return api(`/evidence/${evidenceId}/approve`, { method: 'POST' })
}

export function generateEvidence(evidenceId) {
  return api(`/evidence/${evidenceId}/generate`, { method: 'POST' })
}

export function createManualKsbLink(evidenceId, ksbId) {
  return api(`/evidence/${evidenceId}/ksbs`, {
    method: 'POST',
    body: JSON.stringify({ ksbId, suggestedBy: 'user', reviewStatus: 'accepted' }),
  })
}

export function createManualAcceptanceCriterionLink(evidenceId, acceptanceCriterionId) {
  return api(`/evidence/${evidenceId}/acceptance-criteria`, {
    method: 'POST',
    body: JSON.stringify({
      acceptanceCriterionId,
      suggestedBy: 'user',
      reviewStatus: 'accepted',
    }),
  })
}

export function reviewKsbSuggestion(evidenceId, ksbId, reviewStatus) {
  return api(`/evidence/${evidenceId}/ksbs/${ksbId}/review`, {
    method: 'PUT',
    body: JSON.stringify({ reviewStatus }),
  })
}

export function reviewAcceptanceCriterionSuggestion(
  evidenceId,
  acceptanceCriterionId,
  reviewStatus,
) {
  return api(`/evidence/${evidenceId}/acceptance-criteria/${acceptanceCriterionId}/review`, {
    method: 'PUT',
    body: JSON.stringify({ reviewStatus }),
  })
}
