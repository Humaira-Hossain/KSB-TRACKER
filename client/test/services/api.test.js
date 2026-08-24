import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../src/services/api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api', () => {
  it('sends JSON requests to the configured local backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: '1', title: 'Task' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(api('/tasks', { method: 'POST', body: JSON.stringify({ title: 'Task' }) }))
      .resolves.toEqual({ id: '1', title: 'Task' })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/tasks',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('surfaces an API error message to the UI', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'STAR has already been generated for this task.' }),
    }))

    await expect(api('/evidence/1/generate', { method: 'POST' }))
      .rejects.toThrow('STAR has already been generated for this task.')
  })
})
