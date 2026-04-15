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
    const now = new Date();

    const secondsAgo = new Date(now.getTime() - 30 * 1000).toISOString();
    const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const hoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {_id: '1',userId: 'testuser',rival: 'bot',level: 1,duration: 90,result: 'won',createdAt: '2026-03-01T12:00:00.000Z',},
        {_id: '2',userId: 'testuser',rival: 'multiplayer',level: 3,duration: 120,result: 'lose',createdAt: '2026-03-02T12:00:00.000Z',},
        {_id: '3',userId: 'testuser',rival: 'multiplayer',level: 3,duration: 122,result: 'lose',createdAt: secondsAgo,},
        {_id: '4',userId: 'testuser',rival: 'multiplayer',level: 3,duration: 122,result: 'lose',createdAt: minutesAgo,},
        {_id: '5',userId: 'testuser',rival: 'multiplayer',level: 3,duration: 122,result: 'won',createdAt: hoursAgo,},
        {_id: '6',userId: 'testuser',rival: 'multiplayer',level: 3,duration: 10,result: 'won',createdAt: oneDayAgo,},
        {_id: '7',userId: 'testuser',rival: 'bot',level: 1,duration: 0,result: 'won',createdAt: '2026-03-01T12:00:00.000Z',},
        {_id: '8',userId: 'testuser',rival: 'bot',level: 1,duration: 907,result: 'lose',createdAt: '2026-03-01T12:00:00.000Z',},
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

    expect(screen.getByText('Played')).toBeInTheDocument()
    expect(screen.getByText('Wins')).toBeInTheDocument()
    expect(screen.getByText('Losses')).toBeInTheDocument()
    expect(screen.getByText('Win rate')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getAllByText('Win').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Lose').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Bot/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Player/i).length).toBeGreaterThan(0)
    expect(screen.getByText('1m 30s')).toBeInTheDocument()
    expect(screen.getByText('2m 0s')).toBeInTheDocument()
    expect(screen.getByText(/hace unos segundos/i)).toBeInTheDocument();
    expect(screen.getByText(/hace 5 min/i)).toBeInTheDocument();
    expect(screen.getByText(/hace 2 h/i)).toBeInTheDocument();
    expect(screen.getByText(/hace 1 día/i)).toBeInTheDocument();
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
