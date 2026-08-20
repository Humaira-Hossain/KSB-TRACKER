import { api } from './api'

export async function getCatalogue() {
  const [ksbs, acceptanceCriteria] = await Promise.all([
    api('/ksbs'),
    api('/acceptance-criteria'),
  ])

  return { ksbs, acceptanceCriteria }
}
