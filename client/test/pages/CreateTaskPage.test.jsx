import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CreateTaskPage from '../../src/pages/CreateTaskPage'

describe('CreateTaskPage', () => {
  it('shows the dedicated create-task screen and returns to the dashboard', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()

    render(<CreateTaskPage taskForm={{ title: '', rawNotes: '' }} saving={false} error="" onBack={onBack} onTaskFormChange={vi.fn()} onCreateTask={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Create a task', level: 1 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /dashboard/i }))

    expect(onBack).toHaveBeenCalledOnce()
  })
})
