import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskNotesEditor from '../../src/components/TaskNotesEditor'

describe('TaskNotesEditor', () => {
  it('enables rough notes and reveals save controls when editing starts', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(<TaskNotesEditor rawNotes="Initial meeting notes." saving={false} onSave={onSave} />)

    const roughNotes = screen.getByRole('textbox', { name: 'Rough notes' })
    expect(roughNotes).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Save rough notes' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit rough notes' }))
    expect(roughNotes).toBeEnabled()
    await user.type(roughNotes, '\nFollow up with the team.')
    await user.click(screen.getByRole('button', { name: 'Save rough notes' }))

    expect(onSave).toHaveBeenCalledWith('Initial meeting notes.\nFollow up with the team.')
  })
})
