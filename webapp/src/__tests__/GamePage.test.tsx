import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import GamePage from '../pages/GamePage'
import '@testing-library/jest-dom'

// Mocks para la navegación y el estado de la ruta
const mockNavigate = vi.fn()
let mockLocationState: any = {
  mode: 'bot',
  bot_id: 'random_bot',
  difficulty: 'Medium'
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  }
})

// Mock del contexto de sesión
vi.mock('../SessionContext', () => ({
  useSession: () => ({
    isLoggedIn: true,
    username: 'testuser'
  }),
}))

describe('GamePage Completion Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    
    // Mock del chequeo de estado inicial del servicio de juegos
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => 'OK'
    })
    
    // Mock de localStorage para recuperar el username al guardar la partida
    Storage.prototype.getItem = vi.fn((key) => {
      if (key === 'username') return 'testuser'
      return null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls /game/finish with "won" when user wins against bot', async () => {
    mockLocationState = { mode: 'bot', bot_id: 'random_bot', difficulty: 'Medium' }
    
    // Simulamos respuesta del servidor: fin de partida con victoria para el usuario (B)
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        game_over: true,
        winner: 'B',
        state: { size: 5, layout: 'B..../...../...../...../.....', turn: 1 }
      })
    })

    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText(/Your turn/i)).toBeInTheDocument())

    // Click en la primera celda para ganar
    const circles = screen.getAllByRole('img', { name: /Y game board/i })[0].querySelectorAll('circle')
    fireEvent.click(circles[0])

    // Verificamos que aparece el mensaje de victoria en el diálogo
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Congratulations, you won!'))).toBeInTheDocument()
    }, { timeout: 2000 })

    // Verificamos que se llamó al endpoint de guardado con los datos correctos
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/game/finish'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"result":"won"')
      })
    )
  })

  it('calls /game/finish with "lost" when user loses against bot', async () => {
    mockLocationState = { mode: 'bot', bot_id: 'random_bot', difficulty: 'Medium' }
    
    // Simulamos derrota contra el bot
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        game_over: true,
        winner: 'R',
        state: { size: 5, layout: 'R..../...../...../...../.....', turn: 1 }
      })
    })

    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText(/Your turn/i)).toBeInTheDocument())

    const circles = screen.getAllByRole('img', { name: /Y game board/i })[0].querySelectorAll('circle')
    fireEvent.click(circles[0])

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Oh no! The bot won'))).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/game/finish'),
      expect.objectContaining({
        body: expect.stringContaining('"result":"lost"')
      })
    )
  })

  it('records a multiplayer game correctly when Player B wins', async () => {
    mockLocationState = { mode: 'pvp', bot_id: '', difficulty: 'Medium' }


    
    ;(global.fetch as any).mockReset().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        game_over: true,
        winner: 'B',
        state: { size: 5, layout: 'B..../...../...../...../.....', turn: 1 }
      })
    })

    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText(/Player B turn/i)).toBeInTheDocument())

    const circles = screen.getAllByRole('img', { name: /Y game board/i })[0].querySelectorAll('circle')
    fireEvent.click(circles[0])

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Player B wins!'))).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/game/finish'),
      expect.objectContaining({
        body: expect.stringContaining('"rival":"multiplayer"')
      })
    )
  })
})
