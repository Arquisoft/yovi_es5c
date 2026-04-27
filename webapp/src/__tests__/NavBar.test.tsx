import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import NavBar from '../components/NavBar'

const mockNavigate = vi.fn()
const mockDestroySession = vi.fn()
const mockSession = {
  isLoggedIn: true,
  username: 'testuser',
  destroySession: mockDestroySession,
}

vi.mock('../SessionContext', () => ({
  useSession: () => mockSession,
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
    mockDestroySession.mockReset()
    mockSession.isLoggedIn = true
    mockSession.username = 'testuser'
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('navigates to history from the profile dropdown', async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    )

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /nav\.profile/i }))
    await user.click(screen.getByRole('menuitem', { name: /nav\.history/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/history')
  })

  it('navigates to the profile page from the dropdown', async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    )

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /nav\.profile/i }))
    await user.click(screen.getByRole('menuitem', { name: /nav\.myProfile/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })

  it('logs out the user and calls the logout endpoint', async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    )

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /nav\.profile/i }))
    await user.click(screen.getByRole('menuitem', { name: /nav\.logout/i }))

    expect(mockDestroySession).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/logout',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser' }),
        }
      )
    })
  })

  it('does not render the profile dropdown when the user is not logged in', () => {
    mockSession.isLoggedIn = false

    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    )

    expect(
      screen.queryByRole('button', { name: /nav\.profile/i })
    ).not.toBeInTheDocument()
  })

  it('navigates to the landing page when clicking the title', async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    )

    const user = userEvent.setup()

    // Soporta tanto si usas i18n como si no
    const titleButton =
      screen.queryByRole('button', { name: /game\.titlePvp|game\.titleBot/i }) ||
      screen.queryByRole('button', { name: /game y/i })

    if (!titleButton) throw new Error('Title button not found')

    await user.click(titleButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})

