import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskDetailPage from '../../src/pages/TaskDetailPage'

describe('TaskDetailPage', () => {
  it('lets the user save added rough notes and create evidence', async () => {
    const user = userEvent.setup()
    const onCreateEvidence = vi.fn()
    const onSaveRawNotes = vi.fn()
    const onArchiveTask = vi.fn()
    const task = {
      id: '6',
      title: 'Stakeholder update',
      status: 'draft',
      rawNotes: 'Met with a technical and non-technical audience.',
      evidence: [],
    }

    render(
      <TaskDetailPage
        task={task}
        saving={false}
        error=""
        notice=""
        onBack={vi.fn()}
        onArchiveTask={onArchiveTask}
        onSaveRawNotes={onSaveRawNotes}
        onCreateEvidence={onCreateEvidence}
        onSaveEvidence={vi.fn()}
        onGenerateEvidence={vi.fn()}
        onReviewSuggestion={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit rough notes' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Rough notes' }),
      '\nShared a written update.',
    )
    await user.click(screen.getByRole('button', { name: 'Save rough notes' }))
    expect(onSaveRawNotes).toHaveBeenCalledWith(
      'Met with a technical and non-technical audience.\nShared a written update.',
    )

    await user.click(screen.getByRole('button', { name: 'Create evidence' }))

    expect(onCreateEvidence).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Archive task' }))
    expect(onArchiveTask).toHaveBeenCalledOnce()
  })

  it('shows an unarchive action instead of archive for archived tasks', () => {
    render(
      <TaskDetailPage
        task={{
          id: '7',
          title: 'Archived task',
          status: 'archived',
          rawNotes: 'Saved notes',
          evidence: [],
        }}
        saving={false}
        error=""
        notice=""
        onBack={vi.fn()}
        onArchiveTask={vi.fn()}
        onUnarchiveTask={vi.fn()}
        onSaveRawNotes={vi.fn()}
        onCreateEvidence={vi.fn()}
        onSaveEvidence={vi.fn()}
        onGenerateEvidence={vi.fn()}
        onReviewSuggestion={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Unarchive task' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archive task' })).not.toBeInTheDocument()
  })
})
