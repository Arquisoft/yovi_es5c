import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'
import GameHistory from '../pages/GameHistory'

const mockNavigate = vi.fn()
const mockSession = {
  isLoggedIn: true,
  username: 'testuser',
}

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

vi.mock('../SessionContext', () => ({
  useSession: () => mockSession,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div>{to}</div>,
  }
})

describe('GameHistory', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockSession.isLoggedIn = true
    mockSession.username = 'testuser'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to login when the user is not logged in', () => {
    mockSession.isLoggedIn = false

    render(
      <MemoryRouter>
        <GameHistory />
      </MemoryRouter>
    )

    expect(screen.getByText('/login')).toBeInTheDocument()
  })

  it('loads and displays history stats from the backend', async () => {
    ;(axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          _id: '1',
          userId: 'testuser',
          rival: 'bot',
          level: 1,
          duration: 90,
          result: 'win',
          createdAt: '2026-03-01T12:00:00.000Z',
        },
        {
          _id: '2',
          userId: 'testuser',
          rival: 'user',
          level: 3,
          duration: 120,
          result: 'lose',
          createdAt: '2026-03-02T12:00:00.000Z',
        },
      ],
    })

    render(
      <MemoryRouter>
        <GameHistory />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:8000/user/testuser/history')
    })

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Win')).toBeInTheDocument()
    expect(screen.getByText('Lose')).toBeInTheDocument()
  })

  it('falls back to mock history when the backend returns an empty list', async () => {
    ;(axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
    })

    render(
      <MemoryRouter>
        <GameHistory />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('shows an error state when the history request fails', async () => {
    ;(axios.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: {
        data: {
          error: 'History service unavailable',
        },
      },
    })

    render(
      <MemoryRouter>
        <GameHistory />
      </MemoryRouter>
    )

    expect(await screen.findByText('Could not load history.')).toBeInTheDocument()
  })

  it('navigates back to game setup', async () => {
    ;(axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
    })

    render(
      <MemoryRouter>
        <GameHistory />
      </MemoryRouter>
    )

    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to select mode/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /back to select mode/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/set')
  })
})
