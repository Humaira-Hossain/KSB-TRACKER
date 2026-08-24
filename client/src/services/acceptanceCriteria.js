import { api } from './api'

function getTaskReferences(evidence) {
  const tasks = new Map()

  evidence.forEach(({ task }) => {
    if (!task?.id || tasks.has(String(task.id))) return

    tasks.set(String(task.id), {
      id: task.id,
      title: task.title,
    })
  })

  return [...tasks.values()]
}

function getEvidenceStatus(evidence) {
  if (evidence.length === 0) return 'Not referenced'

  const reviewStatuses = evidence.map((item) => item.review_status)
  if (reviewStatuses.includes('accepted')) return 'Accepted evidence'
  if (reviewStatuses.includes('suggested')) return 'Suggested'
  if (reviewStatuses.includes('rejected')) return 'Rejected'

  return 'Referenced'
}

export async function getAcceptanceCriteriaWithReferences() {
  const criteria = await api('/acceptance-criteria')
  const evidenceResults = await Promise.all(
    criteria.map((criterion) =>
      api(`/acceptance-criteria/${encodeURIComponent(criterion.code)}/evidence`),
    ),
  )

  return criteria.map((criterion, index) => {
    const evidence = evidenceResults[index].evidence ?? []

    return {
      ...criterion,
      status: getEvidenceStatus(evidence),
      referencedIn: getTaskReferences(evidence),
    }
  })
}
