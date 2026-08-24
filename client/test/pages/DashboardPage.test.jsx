import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import DashboardPage from '../../src/pages/DashboardPage'

describe('DashboardPage', () => {
  it('displays real progress metrics and navigates to task creation', async () => {
    const user = userEvent.setup()
    const onCreateTask = vi.fn()

    render(<DashboardPage tasks={[{ status: 'completed' }, { status: 'draft' }]} progress={{ ksbs: { percentage: 50, evidenced: 2, total: 4 }, acceptance_criteria: { percentage: 25, complete: 1, total: 4 } }} loading={false} error="" onCreateTask={onCreateTask} onViewTasks={vi.fn()} />)

    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('1 of 4 complete')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create task' }))

    expect(onCreateTask).toHaveBeenCalledOnce()
  })

  it('shows the KSB action in its own section below the evidence action', () => {
    render(<DashboardPage tasks={[]} progress={{}} loading={false} error="" onCreateTask={vi.fn()} onViewTasks={vi.fn()} onViewKsbs={vi.fn()} />)

    const ksbSection = screen.getByRole('region', { name: 'KSB references' })
    expect(ksbSection).toHaveClass('dashboard-next-step')
    expect(ksbSection).toContainElement(screen.getByRole('button', { name: 'View KSBs' }))
  })
})
