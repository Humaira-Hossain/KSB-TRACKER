import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import KsbDetailPage from '../../src/pages/KsbDetailPage'

const ksbs = [
  {
    code: 'K1',
    description: 'All stages of the software development lifecycle.',
    status: 'Referenced',
    referencedIn: [{ id: '7', title: 'Release planning' }],
  },
  {
    code: 'S2',
    description: 'Develop effective user interfaces.',
    status: 'Not referenced',
    referencedIn: [],
  },
]

describe('KsbDetailPage', () => {
  it('shows KSBs with task links in the references column', () => {
    render(
      <MemoryRouter>
        <KsbDetailPage ksbs={ksbs} loading={false} error="" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('columnheader', { name: 'KSB' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Release planning' })).toHaveAttribute(
      'href',
      '/tasks/7',
    )
    expect(screen.getByRole('cell', { name: 'Not referenced' })).toBeInTheDocument()
  })

  it('filters by status and KSB code', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <KsbDetailPage ksbs={ksbs} loading={false} error="" />
      </MemoryRouter>,
    )

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'Referenced')
    expect(screen.getByText('K1')).toBeInTheDocument()
    expect(screen.queryByText('S2')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'All')
    await user.type(screen.getByLabelText('Filter by KSB code'), 's2')
    expect(screen.getByText('S2')).toBeInTheDocument()
    expect(screen.queryByText('K1')).not.toBeInTheDocument()
  })
})
