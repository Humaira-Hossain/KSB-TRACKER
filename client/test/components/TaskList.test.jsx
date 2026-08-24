import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskList from '../../src/components/TaskList'

describe('TaskList', () => {
  it('renders tasks and opens the selected task', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <TaskList
        tasks={[{ id: '4', title: 'Build API', status: 'draft', evidence_count: 1 }]}
        onSelect={onSelect}
      />,
    )

    expect(screen.getByText('1 evidence item')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /build api/i }))

    expect(onSelect).toHaveBeenCalledWith('4')
  })

  it('shows an empty state when there are no tasks', () => {
    render(<TaskList tasks={[]} onSelect={vi.fn()} />)

    expect(screen.getByText('No tasks yet. Create your first task to begin.')).toBeInTheDocument()
  })
})
