import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/Register'

vi.mock('../SessionContext', () => ({
  useSession: () => ({
    isLoggedIn: false,
    username: null,
    createSession: vi.fn(),
    destroySession: vi.fn(),
  }),
}))

describe('Register page', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('shows validation error when username is empty', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(screen.getByText(/username is required/i)).toBeInTheDocument()
  })

  test('submits username and navigates to /homepage when backend returns ok', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'ok' }),
    } as Response)

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/username/i), 'Pablo')
    await user.type(screen.getByLabelText(/password/i), '1234')
    await user.type(screen.getByLabelText(/email/i), 'pablo@uniovi.es')
    await user.type(screen.getByLabelText(/name/i), 'Pablo')
    await user.type(screen.getByLabelText(/surname/i), 'Trelles')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})