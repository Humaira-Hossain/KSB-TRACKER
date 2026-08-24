import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from '../../src/components/StatusBadge'

describe('StatusBadge', () => {
  it('formats an underscored status for display', () => {
    render(<StatusBadge status="awaiting_review" />)

    expect(screen.getByText('awaiting review')).toBeInTheDocument()
  })
})
