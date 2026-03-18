import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import ProfilePage from '../pages/ProfilePage'

const mockSession = {
  username: 'testuser',
}

vi.mock('../SessionContext', () => ({
  useSession: () => mockSession,
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays the account details', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'testuser',
        name: 'Mario',
        surname: 'Trelles',
        email: 'mario@uniovi.es',
      }),
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    expect(screen.getByText('Mario')).toBeInTheDocument()
    expect(screen.getByText('Trelles')).toBeInTheDocument()
    expect(screen.getByText('mario@uniovi.es')).toBeInTheDocument()
  })
})
