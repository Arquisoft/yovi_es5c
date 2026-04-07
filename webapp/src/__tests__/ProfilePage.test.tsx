import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from '../pages/ProfilePage'

const mockSession = {
  username: 'testuser',
}

const mockNavigate = vi.fn()

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

describe('ProfilePage', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    mockNavigate.mockReset()
    
    // Simulamos el localStorage usando las herramientas de Vitest
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'fake-token-123'),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals() // Limpiamos los stubs globales
  })

  it('loads and displays the account details', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'testuser',
        name: 'Mario',
        surname: 'Trelles',
        email: 'mario@uniovi.es',
      }),
    })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    expect(await screen.findByText('Mario')).toBeInTheDocument()
    expect(screen.getByText('Trelles')).toBeInTheDocument()
    expect(screen.getByText('mario@uniovi.es')).toBeInTheDocument()
  })

  it('allows editing and saving the profile', async () => {
    // Usamos mockImplementation para diferenciar el GET inicial del PUT al guardar
    global.fetch = vi.fn().mockImplementation(async (url, options) => {
      if (options?.method === 'PUT') {
        return {
          ok: true,
          json: async () => ({
            username: 'testuser',
            name: 'Mario',
            surname: 'Garcia', // Datos nuevos
            email: 'mario.garcia@uniovi.es',
          }),
        }
      }
      // Respuesta por defecto para el GET inicial
      return {
        ok: true,
        json: async () => ({
          username: 'testuser',
          name: 'Mario',
          surname: 'Trelles', // Datos antiguos
          email: 'mario@uniovi.es',
        }),
      }
    })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeEnabled()
    })

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Mario')
    await user.clear(screen.getByLabelText('Surname'))
    await user.type(screen.getByLabelText('Surname'), 'Garcia')
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'mario.garcia@uniovi.es')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      // Verificamos que se haya hecho la petición PUT con los datos correctos
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/testuser'),
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

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully.')).toBeInTheDocument()
    })
    expect(screen.getByText('Mario')).toBeInTheDocument()
    expect(screen.getByText('Garcia')).toBeInTheDocument()
    expect(screen.getByText('mario.garcia@uniovi.es')).toBeInTheDocument()
  })

  it('shows an error message when loading the profile fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Could not load profile information.',
      }),
    })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    expect(await screen.findByText('Could not load profile information.')).toBeInTheDocument()
  })

  it('cancels profile editing and restores the saved values', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'testuser',
        name: 'Mario',
        surname: 'Trelles',
        email: 'mario@uniovi.es',
      }),
    })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByLabelText('Surname'))
    await user.type(screen.getByLabelText('Surname'), 'Garcia')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.getByText('Trelles')).toBeInTheDocument()
    })
    expect(screen.queryByDisplayValue('Garcia')).not.toBeInTheDocument()
  })

  it('shows an error message when saving the profile fails', async () => {
    // Igual que antes, separamos el PUT del GET
    global.fetch = vi.fn().mockImplementation(async (url, options) => {
      if (options?.method === 'PUT') {
        return {
          ok: false,
          json: async () => ({
            error: 'Could not update profile information.',
          }),
        }
      }
      return {
        ok: true,
        json: async () => ({
          username: 'testuser',
          name: 'Mario',
          surname: 'Trelles',
          email: 'mario@uniovi.es',
        }),
      }
    })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText('Could not update profile information.')).toBeInTheDocument()
  })

  it('navigates to history when clicking view history', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'testuser',
        name: 'Mario',
        surname: 'Trelles',
        email: 'mario@uniovi.es',
      }),
    })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view history/i })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: /view history/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/history')
  })
})