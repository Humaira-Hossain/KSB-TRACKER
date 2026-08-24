import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SuggestionGroup from '../../src/components/SuggestionGroup'

describe('SuggestionGroup', () => {
  it('shows the KSB description and sends an accepted review action', async () => {
    const user = userEvent.setup()
    const onReview = vi.fn()
    const evidence = { id: '9' }
    const suggestion = {
      id: '1',
      code: 'K1',
      description: 'All stages of the software development lifecycle.',
      rationale: 'The notes explain lifecycle stages.',
      confidence: 0.9,
      reviewStatus: 'suggested',
    }

    render(
      <SuggestionGroup
        title="KSBs"
        type="ksb"
        evidence={evidence}
        items={[suggestion]}
        saving={false}
        onReview={onReview}
      />,
    )

    expect(
      screen.getByText('All stages of the software development lifecycle.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Accept' }))

    expect(onReview).toHaveBeenCalledWith(evidence, 'ksb', suggestion, 'accepted')
  })

  it('shows the reviewed state instead of action buttons', () => {
    render(
      <SuggestionGroup
        title="Acceptance criteria"
        type="ac"
        evidence={{ id: '9' }}
        items={[{ id: '3', code: 'AC03', reviewStatus: 'rejected' }]}
        saving={false}
        onReview={vi.fn()}
      />,
    )

    expect(screen.getByText('rejected')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
  })
})
