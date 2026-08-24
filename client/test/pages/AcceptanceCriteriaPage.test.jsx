import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AcceptanceCriteriaPage from '../../src/pages/AcceptanceCriteriaPage'

const criteria = [
  {
    code: 'AC03',
    description: 'Plan delivery with stakeholders.',
    level: 'Pass',
    ksb_codes: ['K1'],
    status: 'Accepted evidence',
    referencedIn: [{ id: '7', title: 'Release planning' }],
  },
  {
    code: 'DC01',
    description: 'Evaluate delivery outcomes.',
    level: 'Distinction',
    ksb_codes: ['K1', 'S2'],
    status: 'Not referenced',
    referencedIn: [],
  },
]

describe('AcceptanceCriteriaPage', () => {
  it('shows distinction criteria, required KSBs, and task links', () => {
    render(
      <MemoryRouter>
        <AcceptanceCriteriaPage criteria={criteria} loading={false} error="" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('columnheader', { name: 'Criterion' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Distinction' })).toBeInTheDocument()
    expect(screen.getByText('K1, S2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Release planning' })).toHaveAttribute(
      'href',
      '/tasks/7',
    )
  })

  it('filters by criterion level, evidence status, and code', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AcceptanceCriteriaPage criteria={criteria} loading={false} error="" />
      </MemoryRouter>,
    )

    await user.selectOptions(screen.getByLabelText('Filter by level'), 'Distinction')
    expect(screen.getByText('DC01')).toBeInTheDocument()
    expect(screen.queryByText('AC03')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filter by level'), 'All levels')
    await user.selectOptions(
      screen.getByLabelText('Filter by evidence status'),
      'Accepted evidence',
    )
    expect(screen.getByText('AC03')).toBeInTheDocument()
    expect(screen.queryByText('DC01')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filter by evidence status'), 'All statuses')
    await user.type(screen.getByLabelText('Filter by AC code'), 'dc01')
    expect(screen.getByText('DC01')).toBeInTheDocument()
    expect(screen.queryByText('AC03')).not.toBeInTheDocument()
  })
})
