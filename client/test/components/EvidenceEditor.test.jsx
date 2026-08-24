import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EvidenceEditor from '../../src/components/EvidenceEditor'

const evidence = {
  id: '8',
  title: 'Initial evidence',
  rawNotes: 'Rough notes',
  situation: '',
  task: '',
  action: '',
  result: '',
  status: 'draft',
  ai_generated: false,
  ksbs: [],
  acceptanceCriteria: [],
}

describe('EvidenceEditor', () => {
  it('saves edited STAR content', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(<EvidenceEditor evidence={evidence} saving={false} generationLocked={false} onSave={onSave} onGenerate={vi.fn()} onReview={vi.fn()} />)

    await user.type(screen.getByRole('textbox', { name: 'situation' }), 'A stakeholder needed an update.')
    await user.click(screen.getByRole('button', { name: 'Save evidence' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ situation: 'A stakeholder needed an update.' }))
  })

  it('locks STAR generation after another evidence item on the task generated it', () => {
    render(<EvidenceEditor evidence={evidence} saving={false} generationLocked onSave={vi.fn()} onGenerate={vi.fn()} onReview={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Generate STAR' })).toBeDisabled()
    expect(screen.getByText(/STAR has already been generated for this task/i)).toBeInTheDocument()
  })
})
