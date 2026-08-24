import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import TaskForm from '../../src/components/TaskForm'

describe('TaskForm', () => {
  it('passes changed task values and submits the form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event) => event.preventDefault())

    function ControlledTaskForm() {
      const [task, setTask] = useState({ title: '', rawNotes: '' })
      return <TaskForm task={task} saving={false} onChange={setTask} onSubmit={onSubmit} onCancel={vi.fn()} />
    }

    render(<ControlledTaskForm />)

    await user.type(screen.getByRole('textbox', { name: 'Task title' }), 'Release planning')
    await user.type(screen.getByRole('textbox', { name: 'Rough notes' }), 'Worked with the team')
    await user.click(screen.getByRole('button', { name: 'Save task' }))

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('calls onCancel from the cancel button', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(<TaskForm task={{ title: '', rawNotes: '' }} saving={false} onChange={vi.fn()} onSubmit={vi.fn()} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })
})
