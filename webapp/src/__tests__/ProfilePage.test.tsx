import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('allows editing and saving the profile', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: 'testuser',
          name: 'Mario',
          surname: 'Trelles',
          email: 'mario@uniovi.es',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: 'testuser',
          name: 'Mario',
          surname: 'Garcia',
          email: 'mario.garcia@uniovi.es',
        }),
      })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeEnabled()
    })

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /edit profile/i }))
    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Mario')
    await user.clear(screen.getByLabelText('Surname'))
    await user.type(screen.getByLabelText('Surname'), 'Garcia')
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'mario.garcia@uniovi.es')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:8000/user/testuser',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            name: 'Mario',
            surname: 'Garcia',
            email: 'mario.garcia@uniovi.es',
          }),
        })
      )
    })

    expect(screen.getByText('Profile updated successfully.')).toBeInTheDocument()
    expect(screen.getByText('Mario')).toBeInTheDocument()
    expect(screen.getByText('Garcia')).toBeInTheDocument()
    expect(screen.getByText('mario.garcia@uniovi.es')).toBeInTheDocument()
  })
})
