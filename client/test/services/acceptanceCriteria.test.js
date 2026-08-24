import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../src/services/api'
import { getAcceptanceCriteriaWithReferences } from '../../src/services/acceptanceCriteria'

vi.mock('../../src/services/api', () => ({ api: vi.fn() }))

describe('getAcceptanceCriteriaWithReferences', () => {
  beforeEach(() => {
    api.mockReset()
  })

  it('keeps the criterion level and maps linked evidence to unique task references', async () => {
    api
      .mockResolvedValueOnce([
        { code: 'AC03', level: 'Pass', description: 'Plan delivery.', ksb_codes: ['K1'] },
        {
          code: 'DC01',
          level: 'Distinction',
          description: 'Evaluate delivery.',
          ksb_codes: ['K1', 'S2'],
        },
      ])
      .mockResolvedValueOnce({
        evidence: [{ review_status: 'accepted', task: { id: '3', title: 'Planning' } }],
      })
      .mockResolvedValueOnce({
        evidence: [{ review_status: 'suggested', task: { id: '4', title: 'Retrospective' } }],
      })

    await expect(getAcceptanceCriteriaWithReferences()).resolves.toEqual([
      {
        code: 'AC03',
        level: 'Pass',
        description: 'Plan delivery.',
        ksb_codes: ['K1'],
        status: 'Accepted evidence',
        referencedIn: [{ id: '3', title: 'Planning' }],
      },
      {
        code: 'DC01',
        level: 'Distinction',
        description: 'Evaluate delivery.',
        ksb_codes: ['K1', 'S2'],
        status: 'Suggested',
        referencedIn: [{ id: '4', title: 'Retrospective' }],
      },
    ])

    expect(api).toHaveBeenNthCalledWith(2, '/acceptance-criteria/AC03/evidence')
    expect(api).toHaveBeenNthCalledWith(3, '/acceptance-criteria/DC01/evidence')
  })
})
