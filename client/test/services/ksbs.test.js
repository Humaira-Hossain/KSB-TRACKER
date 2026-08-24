import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../src/services/api'
import { getKsbsWithReferences } from '../../src/services/ksbs'

vi.mock('../../src/services/api', () => ({ api: vi.fn() }))

describe('getKsbsWithReferences', () => {
  beforeEach(() => {
    api.mockReset()
  })

  it('maps linked evidence tasks to unique KSB task references', async () => {
    api
      .mockResolvedValueOnce([
        { code: 'K1', description: 'Lifecycle' },
        { code: 'S2', description: 'Interfaces' },
      ])
      .mockResolvedValueOnce({
        evidence: [
          { task: { id: '3', title: 'Planning' } },
          { task: { id: '3', title: 'Planning' } },
          { task: { id: '4', title: 'Testing' } },
        ],
      })
      .mockResolvedValueOnce({ evidence: [] })

    await expect(getKsbsWithReferences()).resolves.toEqual([
      {
        code: 'K1',
        description: 'Lifecycle',
        status: 'Referenced',
        referencedIn: [
          { id: '3', title: 'Planning' },
          { id: '4', title: 'Testing' },
        ],
      },
      {
        code: 'S2',
        description: 'Interfaces',
        status: 'Not referenced',
        referencedIn: [],
      },
    ])

    expect(api).toHaveBeenNthCalledWith(2, '/ksbs/K1/evidence')
    expect(api).toHaveBeenNthCalledWith(3, '/ksbs/S2/evidence')
  })
})
