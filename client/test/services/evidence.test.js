import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../src/services/api'
import {
  createManualAcceptanceCriterionLink,
  createManualKsbLink,
  deleteEvidence,
  approveEvidence,
} from '../../src/services/evidence'

vi.mock('../../src/services/api', () => ({ api: vi.fn() }))

describe('manual evidence links', () => {
  beforeEach(() => {
    api.mockReset()
  })

  it('creates an accepted KSB link selected by the user', async () => {
    api.mockResolvedValue({ evidence_id: '8', ksb_id: '1', review_status: 'accepted' })

    await createManualKsbLink('8', '1')

    expect(api).toHaveBeenCalledWith('/evidence/8/ksbs', {
      method: 'POST',
      body: JSON.stringify({ ksbId: '1', suggestedBy: 'user', reviewStatus: 'accepted' }),
    })
  })

  it('creates an accepted acceptance-criterion link selected by the user', async () => {
    api.mockResolvedValue({
      evidence_id: '8',
      acceptance_criteria_id: '3',
      review_status: 'accepted',
    })

    await createManualAcceptanceCriterionLink('8', '3')

    expect(api).toHaveBeenCalledWith('/evidence/8/acceptance-criteria', {
      method: 'POST',
      body: JSON.stringify({
        acceptanceCriterionId: '3',
        suggestedBy: 'user',
        reviewStatus: 'accepted',
      }),
    })
  })
})

describe('deleteEvidence', () => {
  it('sends a DELETE request for the selected evidence item', async () => {
    api.mockResolvedValue(null)

    await expect(deleteEvidence('8')).resolves.toBeNull()

    expect(api).toHaveBeenCalledWith('/evidence/8', { method: 'DELETE' })
  })
})

describe('approveEvidence', () => {
  it('asks the API to approve reviewed evidence', async () => {
    api.mockResolvedValue({ id: '8', status: 'approved', user_reviewed: true })

    await approveEvidence('8')

    expect(api).toHaveBeenCalledWith('/evidence/8/approve', { method: 'POST' })
  })
})
