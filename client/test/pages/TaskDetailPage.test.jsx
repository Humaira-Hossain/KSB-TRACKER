import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskDetailPage from '../../src/pages/TaskDetailPage'

describe('TaskDetailPage', () => {
  it('shows task notes and creates evidence', async () => {
    const user = userEvent.setup()
    const onCreateEvidence = vi.fn()
    const task = {
      id: '6',
      title: 'Stakeholder update',
      status: 'draft',
      rawNotes: 'Met with a technical and non-technical audience.',
      evidence: [],
    }

    render(<TaskDetailPage task={task} saving={false} error="" notice="" onBack={vi.fn()} onCreateEvidence={onCreateEvidence} onSaveEvidence={vi.fn()} onGenerateEvidence={vi.fn()} onReviewSuggestion={vi.fn()} />)

    expect(screen.getByText('Met with a technical and non-technical audience.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create evidence' }))

    expect(onCreateEvidence).toHaveBeenCalledOnce()
  })
})
