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

    render(
      <EvidenceEditor
        evidence={evidence}
        saving={false}
        generationLocked={false}
        onSave={onSave}
        onGenerate={vi.fn()}
        onReview={vi.fn()}
      />,
    )

    await user.type(
      screen.getByRole('textbox', { name: 'situation' }),
      'A stakeholder needed an update.',
    )
    await user.click(screen.getByRole('button', { name: 'Save evidence' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ situation: 'A stakeholder needed an update.' }),
    )
  })

  it('locks STAR generation after another evidence item on the task generated it', () => {
    render(
      <EvidenceEditor
        evidence={evidence}
        saving={false}
        generationLocked
        onSave={vi.fn()}
        onGenerate={vi.fn()}
        onReview={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Generate STAR' })).toBeDisabled()
    expect(screen.getByText(/STAR has already been generated for this task/i)).toBeInTheDocument()
  })

  it('requests permanent deletion for the selected evidence item', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(
      <EvidenceEditor
        evidence={evidence}
        saving={false}
        generationLocked={false}
        onSave={vi.fn()}
        onGenerate={vi.fn()}
        onReview={vi.fn()}
        onDelete={onDelete}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Delete evidence' }))

    expect(onDelete).toHaveBeenCalledWith('8')
  })

  it('lets the user add an accepted KSB link from the real catalogue', async () => {
    const user = userEvent.setup()
    const onAddManualLink = vi.fn().mockResolvedValue(true)
    const ksb = { id: '1', code: 'K1', description: 'Software development lifecycle.' }

    render(
      <EvidenceEditor
        evidence={evidence}
        catalogue={{ ksbs: [ksb], acceptanceCriteria: [] }}
        saving={false}
        generationLocked={false}
        onSave={vi.fn()}
        onGenerate={vi.fn()}
        onReview={vi.fn()}
        onAddManualLink={onAddManualLink}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Add KSB'), '1')
    await user.click(screen.getByRole('button', { name: 'Add KSB' }))

    expect(onAddManualLink).toHaveBeenCalledWith(evidence, 'ksb', ksb)
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  it('does not display a manual link as accepted when saving it fails', async () => {
    const user = userEvent.setup()

    render(
      <EvidenceEditor
        evidence={evidence}
        catalogue={{
          ksbs: [{ id: '1', code: 'K1', description: 'Lifecycle.' }],
          acceptanceCriteria: [],
        }}
        saving={false}
        generationLocked={false}
        onSave={vi.fn()}
        onGenerate={vi.fn()}
        onReview={vi.fn()}
        onAddManualLink={vi.fn().mockResolvedValue(false)}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Add KSB'), '1')
    await user.click(screen.getByRole('button', { name: 'Add KSB' }))

    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  })

  it('updates review controls immediately after accepting a suggestion', async () => {
    const user = userEvent.setup()
    const onReview = vi.fn().mockResolvedValue(true)
    const suggestedEvidence = {
      ...evidence,
      ksbs: [{ id: '1', code: 'K1', reviewStatus: 'suggested', suggestedBy: 'ai' }],
    }

    render(
      <EvidenceEditor
        evidence={suggestedEvidence}
        saving={false}
        generationLocked={false}
        onSave={vi.fn()}
        onGenerate={vi.fn()}
        onReview={onReview}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Accept' }))

    expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  it('updates review controls immediately after rejecting a suggestion', async () => {
    const user = userEvent.setup()
    const onReview = vi.fn().mockResolvedValue(true)
    const suggestedEvidence = {
      ...evidence,
      ksbs: [{ id: '1', code: 'K1', reviewStatus: 'suggested', suggestedBy: 'ai' }],
    }

    render(
      <EvidenceEditor
        evidence={suggestedEvidence}
        saving={false}
        generationLocked={false}
        onSave={vi.fn()}
        onGenerate={vi.fn()}
        onReview={onReview}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Reject' }))

    expect(await screen.findByRole('button', { name: 'Reconsider' })).toBeInTheDocument()
  })

  it('approves evidence after every suggestion has been reviewed', async () => {
    const user = userEvent.setup()
    const onApprove = vi
      .fn()
      .mockResolvedValue({ id: '8', status: 'approved', user_reviewed: true })

    render(
      <EvidenceEditor
        evidence={evidence}
        saving={false}
        generationLocked={false}
        onSave={vi.fn()}
        onGenerate={vi.fn()}
        onReview={vi.fn()}
        onApprove={onApprove}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Approve evidence' }))

    expect(onApprove).toHaveBeenCalledWith(evidence)
    expect(await screen.findByText('approved')).toBeInTheDocument()
  })

  it('keeps approval disabled while suggestions are pending', () => {
    render(
      <EvidenceEditor
        evidence={{ ...evidence, ksbs: [{ id: '1', code: 'K1', reviewStatus: 'suggested' }] }}
        saving={false}
        generationLocked={false}
        onSave={vi.fn()}
        onGenerate={vi.fn()}
        onReview={vi.fn()}
        onApprove={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Approve evidence' })).toBeDisabled()
  })
})
