import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../src/services/api'
import { archiveTask, updateTask } from '../../src/services/tasks'

vi.mock('../../src/services/api', () => ({ api: vi.fn() }))

describe('updateTask', () => {
  beforeEach(() => {
    api.mockReset()
  })

  it('saves updated rough notes through the existing task PATCH endpoint', async () => {
    api.mockResolvedValue({ id: '6', raw_notes: 'Updated notes' })

    await expect(updateTask('6', { rawNotes: 'Updated notes' })).resolves.toEqual({
      id: '6',
      raw_notes: 'Updated notes',
    })

    expect(api).toHaveBeenCalledWith('/tasks/6', {
      method: 'PATCH',
      body: JSON.stringify({ rawNotes: 'Updated notes' }),
    })
  })
})

describe('archiveTask', () => {
  beforeEach(() => {
    api.mockReset()
  })

  it('uses the existing task DELETE endpoint to archive a task', async () => {
    api.mockResolvedValue({ id: '6', status: 'archived' })

    await expect(archiveTask('6')).resolves.toEqual({ id: '6', status: 'archived' })

    expect(api).toHaveBeenCalledWith('/tasks/6', { method: 'DELETE' })
  })
})
