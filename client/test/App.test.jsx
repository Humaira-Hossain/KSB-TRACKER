import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { getCatalogue } from '../src/services/catalogue'
import { getAcceptanceCriteriaWithReferences } from '../src/services/acceptanceCriteria'
import { getProgress } from '../src/services/progress'
import { getKsbsWithReferences } from '../src/services/ksbs'
import { archiveTask, getTask, getTasks, updateTask } from '../src/services/tasks'

vi.mock('../src/services/catalogue', () => ({ getCatalogue: vi.fn() }))
vi.mock('../src/services/acceptanceCriteria', () => ({
  getAcceptanceCriteriaWithReferences: vi.fn(),
}))
vi.mock('../src/services/progress', () => ({ getProgress: vi.fn() }))
vi.mock('../src/services/ksbs', () => ({ getKsbsWithReferences: vi.fn() }))
vi.mock('../src/services/tasks', () => ({
  createTask: vi.fn(),
  archiveTask: vi.fn(),
  getTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn(),
}))
vi.mock('../src/services/evidence', () => ({
  createEvidence: vi.fn(),
  generateEvidence: vi.fn(),
  reviewAcceptanceCriterionSuggestion: vi.fn(),
  reviewKsbSuggestion: vi.fn(),
  updateEvidence: vi.fn(),
}))

beforeEach(() => {
  getTasks.mockResolvedValue([])
  getCatalogue.mockResolvedValue({ ksbs: [], acceptanceCriteria: [] })
  getAcceptanceCriteriaWithReferences.mockResolvedValue([])
  getProgress.mockResolvedValue({
    ksbs: { percentage: 0, evidenced: 0, total: 0 },
    acceptance_criteria: { percentage: 0, complete: 0, total: 0 },
  })
  getKsbsWithReferences.mockResolvedValue([])
  getTask.mockResolvedValue({
    id: '7',
    title: 'Direct URL task',
    status: 'draft',
    raw_notes: 'Some rough notes',
    evidence: [],
  })
  updateTask.mockResolvedValue({ id: '7', raw_notes: 'Saved rough notes' })
  archiveTask.mockResolvedValue({ id: '7', status: 'archived' })
})

describe('App routes', () => {
  it('navigates from the dashboard to the dedicated create-task page', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create task' }))

    expect(screen.getByRole('heading', { name: 'Create a task', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Task title' })).toBeInTheDocument()
  })

  it('loads a task when opening a task URL directly', async () => {
    render(
      <MemoryRouter initialEntries={['/tasks/7']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Direct URL task' })).toBeInTheDocument()
    expect(getTask).toHaveBeenCalledWith('7')
  })

  it('saves edited rough notes from the task detail page', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/tasks/7']}>
        <App />
      </MemoryRouter>,
    )

    const roughNotes = await screen.findByRole('textbox', { name: 'Rough notes' })
    await user.click(screen.getByRole('button', { name: 'Edit rough notes' }))
    await user.clear(roughNotes)
    await user.type(roughNotes, 'Saved rough notes')
    await user.click(screen.getByRole('button', { name: 'Save rough notes' }))

    expect(updateTask).toHaveBeenCalledWith('7', { rawNotes: 'Saved rough notes' })
    expect(await screen.findByText('Rough notes saved.')).toBeInTheDocument()
  })

  it('archives a task from its detail page and returns to the task list', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/tasks/7']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Direct URL task' })
    await user.click(screen.getByRole('button', { name: 'Archive task' }))

    expect(archiveTask).toHaveBeenCalledWith('7')
    expect(await screen.findByRole('heading', { name: 'Your tasks' })).toBeInTheDocument()
  })

  it('restores an archived task to draft status', async () => {
    const user = userEvent.setup()
    getTask.mockResolvedValueOnce({
      id: '7',
      title: 'Archived task',
      status: 'archived',
      raw_notes: 'Some rough notes',
      evidence: [],
    })
    updateTask.mockResolvedValueOnce({ id: '7', status: 'draft' })

    render(
      <MemoryRouter initialEntries={['/tasks/7']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Archived task' })
    await user.click(screen.getByRole('button', { name: 'Unarchive task' }))

    expect(updateTask).toHaveBeenCalledWith('7', { status: 'draft' })
    expect(screen.getByRole('button', { name: 'Archive task' })).toBeInTheDocument()
  })

  it('navigates from the dashboard to the KSB detail page', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Overview' })
    await user.click(screen.getByRole('button', { name: 'View KSBs' }))

    expect(await screen.findByRole('heading', { name: 'KSBs and references' })).toBeInTheDocument()
  })

  it('navigates from the dashboard to the acceptance criteria page', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Overview' })
    await user.click(screen.getByRole('button', { name: 'View acceptance criteria' }))

    expect(
      await screen.findByRole('heading', { name: 'Acceptance criteria and references' }),
    ).toBeInTheDocument()
  })
})
