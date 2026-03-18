import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import NavBar from '../components/NavBar'

const mockNavigate = vi.fn()

vi.mock('../SessionContext', () => ({
  useSession: () => ({
    isLoggedIn: true,
    username: 'testuser',
    destroySession: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('NavBar', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('navigates to history from the profile dropdown', async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    )

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /profile/i }))
    await user.click(screen.getByRole('menuitem', { name: /history/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/history')
  })
})
