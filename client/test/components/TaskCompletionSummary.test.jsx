import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskCompletionSummary from '../../src/components/TaskCompletionSummary'

describe('TaskCompletionSummary', () => {
  it('shows accepted and unresolved suggestions before the user completes a task', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()

    render(
      <TaskCompletionSummary
        evidence={[
          {
            ksbs: [
              { code: 'K1', reviewStatus: 'accepted' },
              { code: 'S2', reviewStatus: 'suggested' },
            ],
            acceptanceCriteria: [
              { code: 'AC03', reviewStatus: 'accepted' },
              { code: 'DC01', reviewStatus: 'rejected' },
            ],
          },
        ]}
        saving={false}
        onComplete={onComplete}
      />,
    )

    expect(screen.getByText('Accepted KSBs: K1')).toBeInTheDocument()
    expect(screen.getByText('Accepted acceptance criteria: AC03')).toBeInTheDocument()
    expect(screen.getByText('Pending suggestions: S2')).toBeInTheDocument()
    expect(screen.getByText('Rejected suggestions: DC01')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mark task complete' }))
    expect(onComplete).toHaveBeenCalledOnce()
  })
})
