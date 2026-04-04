import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import GamePage from '../pages/GamePage';
import { useSession } from '../SessionContext';
import { useLocation } from 'react-router-dom';

// Mock de variables de entorno de Vite
vi.stubEnv('VITE_API_URL', 'http://localhost:8000');

// Mock del contexto de sesión
vi.mock('../SessionContext', () => ({
  useSession: vi.fn(),
}));

// Mock de React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: vi.fn(),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
}));

// Mock de la función externa importada de GameSetup
vi.mock('../utils/gameUtils', () => ({
  getInitialBoardSize: vi.fn(() => 3),
  minBoardSize: 3,
  maxBoardSize: 15,
}));

// Mock de la API global fetch
global.fetch = vi.fn();

describe('GamePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Comportamiento por defecto del fetch (status OK)
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      text: async () => 'OK',
      json: async () => ({})
    });
  });

  it('debe redirigir a /login si el usuario no está logueado', () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: false });
    (useLocation as Mock).mockReturnValue({ state: null });

    render(<GamePage />);

    expect(screen.getByTestId('navigate')).toHaveTextContent('/login');
  });

  it('debe renderizar el tablero en modo bot por defecto si está logueado', async () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: true });
    (useLocation as Mock).mockReturnValue({ state: null });

    render(<GamePage />);

    // Verifica que el título corresponda al modo bot
    expect(screen.getByText('Game Y - Player vs Bot')).toBeInTheDocument();
    
    // Verifica que el SVG del tablero se haya renderizado
    expect(screen.getByRole('img', { name: /Y game board/i })).toBeInTheDocument();
  });

  it('debe renderizar en modo pvp si se pasa por el estado de navegación', () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: true });
    (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } });

    render(<GamePage />);

    expect(screen.getByText('Game Y - Player vs Player')).toBeInTheDocument();
  });

  it('debe llamar a la API de movimiento al hacer clic en una celda vacía', async () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: true });
    (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } });

    // Mockeamos la respuesta del movimiento
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        game_over: false,
        winner: null,
        state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' } // Tablero simulado
      })
    });

    const { container } = render(<GamePage />);

    // Buscamos el primer grupo (<g>) que envuelve un hexágono (celda 0,0) y simulamos un click
    const firstCell = container.querySelector('g');
    expect(firstCell).not.toBeNull();
    
    fireEvent.click(firstCell!);

    // Verificamos que se haya hecho la petición POST a /game/move
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/game/move'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('debe resetear el tablero al hacer clic en "New Game"', () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: true });
    (useLocation as Mock).mockReturnValue({ state: { mode: 'bot' } });

    render(<GamePage />);

    const newGameButton = screen.getByRole('button', { name: /New Game/i });
    fireEvent.click(newGameButton);

    // Si se resetea, el mensaje vuelve al turno inicial
    expect(screen.getByText('Your turn. Place a piece.')).toBeInTheDocument();
  });

  it('debe navegar a /homepage al hacer clic en "Back to Home"', () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: true });
    (useLocation as Mock).mockReturnValue({ state: null });

    render(<GamePage />);

    const backButton = screen.getByRole('button', { name: /Back to Home/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/homepage');
  });

  it('debe mostrar error si el servicio de juego no está disponible al hacer click', async () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: true });
    (useLocation as Mock).mockReturnValue({ state: null });

    // Simulamos que la comprobación inicial del estado (/game/status) falla
    (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<GamePage />);

    // Esperamos un momento para que el useEffect procese el error
    await waitFor(() => {});

    // Intentamos jugar
    const firstCell = container.querySelector('g');
    fireEvent.click(firstCell!);

    // Debería mostrar el error por servicio no disponible
    await waitFor(() => {
      expect(screen.getByText('Game service is unavailable.')).toBeInTheDocument();
    });
  });

  it('debe manejar errores si la API falla al intentar hacer un movimiento', async () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: true });
    (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } });

    (global.fetch as Mock)
      .mockResolvedValueOnce({ ok: true, text: async () => 'OK' }) // fetch 1: checkStatus (OK)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Movimiento inválido' }) // fetch 2: move (Falla)
      }); 

    const { container } = render(<GamePage />);

    const firstCell = container.querySelector('g');
    fireEvent.click(firstCell!);

    // Se debe atrapar el error, mostrar el mensaje del backend y el genérico
    await waitFor(() => {
      expect(screen.getByText('Movimiento inválido')).toBeInTheDocument();
      expect(screen.getByText('Your move could not be completed.')).toBeInTheDocument();
    });
  });

  it('debe mostrar el ganador correcto cuando finaliza el juego (Gana Player 1)', async () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: true });
    (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } });

    (global.fetch as Mock)
      .mockResolvedValueOnce({ ok: true, text: async () => 'OK' })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          game_over: true,
          winner: 'B',
          state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/BB/...' }
        })
      });

    const { container } = render(<GamePage />);
    const firstCell = container.querySelector('g');
    fireEvent.click(firstCell!);

    await waitFor(() => {
      expect(screen.getByText('Player 1 wins.')).toBeInTheDocument();
    });
  });

  it('debe mostrar el ganador correcto cuando el Bot gana (Gana R en modo bot)', async () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: true });
    (useLocation as Mock).mockReturnValue({ state: { mode: 'bot' } });

    (global.fetch as Mock)
      .mockResolvedValueOnce({ ok: true, text: async () => 'OK' })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          game_over: true,
          winner: 'R',
          state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'R/RR/...' }
        })
      });

    const { container } = render(<GamePage />);
    const firstCell = container.querySelector('g');
    fireEvent.click(firstCell!);

    // Aumentamos el timeout del waitFor porque el modo bot tiene un delay artificial (botDelayMs = 700)
    await waitFor(() => {
      expect(screen.getByText('Bot wins.')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('no debe hacer la petición si se hace clic en una celda ya ocupada', async () => {
    (useSession as Mock).mockReturnValue({ isLoggedIn: true });
    (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } });

    (global.fetch as Mock)
      .mockResolvedValueOnce({ ok: true, text: async () => 'OK' }) // checkStatus
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          game_over: false,
          winner: null,
          state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' } // La celda ya tiene 'B'
        })
      });

    const { container } = render(<GamePage />);
    
    // Primer clic: hace el movimiento
    const firstCell = container.querySelector('g');
    fireEvent.click(firstCell!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2); // 1 (status) + 1 (move)
    });

    // Segundo clic: en la misma celda, que el estado ya reconoció como "B" gracias a boardFromLayout
    fireEvent.click(firstCell!);

    // Comprobamos que no se ha hecho una nueva llamada (se ha abortado el 'play')
    expect(global.fetch).toHaveBeenCalledTimes(2); 
  });
});