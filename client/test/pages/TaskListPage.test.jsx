import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskListPage from '../../src/pages/TaskListPage'

describe('TaskListPage', () => {
  it('allows navigation to task creation and a selected task', async () => {
    const user = userEvent.setup()
    const onCreateTask = vi.fn()
    const onSelectTask = vi.fn()

    render(
      <TaskListPage
        tasks={[{ id: '3', title: 'Testing', status: 'draft', evidence_count: 0 }]}
        loading={false}
        error=""
        onBack={vi.fn()}
        onCreateTask={onCreateTask}
        onSelectTask={onSelectTask}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Create task' }))
    await user.click(screen.getByRole('button', { name: /testing/i }))

    expect(onCreateTask).toHaveBeenCalledOnce()
    expect(onSelectTask).toHaveBeenCalledWith('3')
  })
})
