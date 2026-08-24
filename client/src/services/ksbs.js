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

export async function getKsbsWithReferences() {
  const ksbs = await api('/ksbs')
  const evidenceResults = await Promise.all(
    ksbs.map((ksb) => api(`/ksbs/${encodeURIComponent(ksb.code)}/evidence`)),
  )

  return ksbs.map((ksb, index) => {
    const referencedIn = getTaskReferences(evidenceResults[index].evidence ?? [])

    return {
      ...ksb,
      status: referencedIn.length > 0 ? 'Referenced' : 'Not referenced',
      referencedIn,
    }
  })
}
