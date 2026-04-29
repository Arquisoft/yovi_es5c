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
        name: 'Test',
        surname: 'User',
        email: 'test@uniovi.es',
      }),
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)
    

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('test@uniovi.es')).toBeInTheDocument()
    expect(screen.getByText('profile.passwordHelp')).toBeInTheDocument()
  })

  it('allows editing and saving the profile', async () => {
    // Usamos mockImplementation para diferenciar el GET inicial del PUT al guardar
    global.fetch = vi.fn().mockImplementation(async (_, options) => {
      if (options?.method === 'PUT') {
        return {
          ok: true,
          json: async () => ({
            username: 'testuser',
            name: 'Test',
            surname: 'Updated',
            email: 'test.updated@uniovi.es',
          }),
        }
      }
      // Respuesta por defecto para el GET inicial
      return {
        ok: true,
        json: async () => ({
          username: 'testuser',
          name: 'Test',
          surname: 'User',
          email: 'test@uniovi.es',
        }),
      }
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /profile\.edit/i })).toBeEnabled()
    })

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /profile\.edit/i }))
    await user.clear(screen.getByLabelText(/profile\.name/i))
    await user.type(screen.getByLabelText(/profile\.name/i), 'Test')
    await user.clear(screen.getByLabelText(/profile\.surname/i))
    await user.type(screen.getByLabelText(/profile\.surname/i), 'Updated')
    await user.clear(screen.getByLabelText(/profile\.email/i))
    await user.type(screen.getByLabelText(/profile\.email/i), 'test.updated@uniovi.es')
    await user.click(screen.getByRole('button', { name: /profile\.save/i}))

    await waitFor(() => {
      // Verificamos que se haya hecho la petición PUT con los datos correctos
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/testuser'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            name: 'Test',
            surname: 'Updated',
            email: 'test.updated@uniovi.es',
          }),
        })
      )
    })

    expect(await screen.findByText('profile.saveSuccess')).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('Updated')).toBeInTheDocument()
    expect(screen.getByText('test.updated@uniovi.es')).toBeInTheDocument()
  })

  it('shows an error message when loading the profile fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Could not load profile information.',
      }),
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

    expect(await screen.findByText('Could not load profile information.')).toBeInTheDocument()
  })

  it('cancels profile editing and restores the saved values', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'testuser',
        name: 'Test',
        surname: 'User',
        email: 'test@uniovi.es',
      }),
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /profile\.edit/i })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: /profile\.edit/i }))
    await user.clear(screen.getByLabelText(/profile\.surname/i))
    await user.type(screen.getByLabelText(/profile\.surname/i), 'Updated')
    await user.click(screen.getByRole('button', { name: /profile\.cancel/i }))

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    expect(screen.queryByDisplayValue('Updated')).not.toBeInTheDocument()
  })

  it('shows an error message when saving the profile fails', async () => {
    // Igual que antes, separamos el PUT del GET
    global.fetch = vi.fn().mockImplementation(async (_, options) => {
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
          name: 'Test',
          surname: 'User',
          email: 'test@uniovi.es',
        }),
      }
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /profile\.edit/i })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: /profile\.edit/i }))
    await user.click(screen.getByRole('button', { name: /profile\.save/i }))

    expect(await screen.findByText('Could not update profile information.')).toBeInTheDocument()
  })

  it('navigates to history when clicking view history', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'testuser',
        name: 'Test',
        surname: 'User',
        email: 'test@uniovi.es',
      }),
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /profile\.viewHistory/i })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: /profile\.viewHistory/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/history')
  })

  it('navigates to change password page when clicking change password button', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'testuser',
        name: 'Test',
        surname: 'User',
        email: 'test@uniovi.es',
      }),
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)
    const user = userEvent.setup()

    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /profile\.changePassword/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/change-password')
  })
})
