import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import GamePage from '../pages/GamePage'
import { useSession } from '../SessionContext'
import { useLocation } from 'react-router-dom'

// Mock de variables de entorno de Vite
vi.stubEnv('VITE_API_URL', 'http://localhost:8000')

// Mock del contexto de sesión
vi.mock('../SessionContext', () => ({
	useSession: vi.fn(),
}))

// Mock de React Router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
	useNavigate: () => mockNavigate,
	useLocation: vi.fn(),
	Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
}))

// Mock de la función externa importada de GameSetup
vi.mock('../pages/GameSetup', () => ({
	getInitialBoardSize: vi.fn(() => 3),
}))

// Mock de react-i18next
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}))

// Mock de la API global fetch
global.fetch = vi.fn()

describe('GamePage Component', () => {
	beforeEach(() => {
		vi.clearAllMocks()

			// Comportamiento por defecto del fetch (status OK)
			; (global.fetch as Mock).mockResolvedValue({
				ok: true,
				text: async () => 'OK',
				json: async () => ({}),
			})

		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: vi.fn((key) => {
					if (key === 'username') return 'testuser';
					return null;
				}),
				setItem: vi.fn(),
				removeItem: vi.fn(),
				clear: vi.fn(),
			},
			writable: true
		})
	})

it('debe redirigir a /login si el usuario no está logueado', () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: false })
		; (useLocation as Mock).mockReturnValue({ state: null })

	render(<GamePage />)

	expect(screen.getByTestId('navigate')).toHaveTextContent('/login')
})

it('debe renderizar el tablero en modo bot por defecto si está logueado', async () => {
	;(useSession as Mock).mockReturnValue({ isLoggedIn: true })
	;(useLocation as Mock).mockReturnValue({ state: null })

	render(<GamePage />)

	// Verifica que el título corresponda al modo bot
	expect(screen.getByText('game.titleBot')).toBeInTheDocument()

	expect(screen.getByText('game.you')).toBeInTheDocument()
	expect(screen.getByText('game.bot')).toBeInTheDocument()
})

it('debe renderizar en modo pvp si se pasa por el estado de navegación', () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })

	render(<GamePage />)

	expect(screen.getByText('game.titlePvp')).toBeInTheDocument()
	expect(screen.getByText('game.player1')).toBeInTheDocument()
	expect(screen.getByText('game.player2')).toBeInTheDocument()
	expect(screen.queryByRole('button', { name: /game\.swap/i })).not.toBeInTheDocument()
})

it('debe llamar a la API de movimiento al hacer clic en una celda vacía', async () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })

		// Mockeamos la respuesta del movimiento
		; (global.fetch as Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				game_over: false,
				winner: null,
				state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' },
			}),
		})

	const { container } = render(<GamePage />)

	// Buscamos el primer grupo (<g>) que envuelve un hexágono (celda 0,0) y simulamos un click
	const firstCell = container.querySelector('g')
	expect(firstCell).not.toBeNull()

	fireEvent.click(firstCell!)

	// Verificamos que se haya hecho la petición POST a /game/move
	await waitFor(() => {
		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/game/move'),
			expect.objectContaining({ method: 'POST' }),
		)
	})
})

it('debe mostrar la regla del pastel tras la primera jugada en PvP', async () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })

		; (global.fetch as Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				game_over: false,
				winner: null,
				state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' },
			}),
		})

	const { container } = render(<GamePage />)
	const firstCell = container.querySelector('g')
	fireEvent.click(firstCell!)

	await waitFor(() => {
		expect(screen.getByRole('button', { name: /game\.swap/i })).toBeInTheDocument()
	})
})

it('debe enviar la accion swap al aplicar la regla del pastel', async () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })

		; (global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					game_over: false,
					winner: null,
					state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' },
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					game_over: false,
					winner: null,
					state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' },
				}),
			})

	const { container } = render(<GamePage />)
	const firstCell = container.querySelector('g')
	fireEvent.click(firstCell!)

	const pieRuleButton = await screen.findByRole('button', { name: /game\.swap/i })
	fireEvent.click(pieRuleButton)

	await waitFor(() => {
		expect(global.fetch).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining('/game/move'),
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('"action":"swap"'),
			}),
		)
	})

	await waitFor(() => {
		expect(screen.getByText('game.player1')).toBeInTheDocument()
		expect(screen.getByText('game.player2')).toBeInTheDocument()
	})
})

it('debe resetear el tablero al hacer clic en "New Game"', () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'bot' } })

	render(<GamePage />)

	const newGameButton = screen.getByRole('button', { name: /game\.newGame/i })
	fireEvent.click(newGameButton)

	expect(screen.getByText('game.you')).toBeInTheDocument()
	expect(screen.getByText('game.bot')).toBeInTheDocument()
	expect(screen.queryByRole('button', { name: /game\.swap/i })).not.toBeInTheDocument()
})

it('debe navegar a /homepage al hacer clic en "Back to Home"', () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: null })

	render(<GamePage />)

	const backButton = screen.getByRole('button', { name: /game\.backToHome/i })
	fireEvent.click(backButton)

	expect(mockNavigate).toHaveBeenCalledWith('/homepage')
})

it('debe mostrar error si el servicio de juego no está disponible al hacer click', async () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		// Usamos 'bot' para que sí intente hacer el fetch a /status
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'bot' } })

		// Simulamos que la comprobación inicial del estado falla
		; (global.fetch as Mock).mockImplementation(async (url) => {
			if (String(url).includes('/status')) return Promise.reject(new Error('Network error'))
			return { ok: true, json: async () => ({}) }
		})

	const { container } = render(<GamePage />)

	// Esperamos a que pase el useEffect
	await waitFor(() => { })

	// Intentamos jugar
	const firstCell = container.querySelector('g')
	fireEvent.click(firstCell!)

	// Debería mostrar el error por servicio no disponible
	await waitFor(() => {
		expect(screen.getByText('game.serviceUnavailable')).toBeInTheDocument()
	})
})

it('debe manejar errores si la API falla al intentar hacer un movimiento', async () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })

		// Mock inteligente que responde según la ruta
		; (global.fetch as Mock).mockImplementation(async (url) => {
			if (String(url).includes('/move')) {
				return { ok: false, json: async () => ({ error: 'Movimiento inválido' }) }
			}
			return { ok: true, text: async () => 'OK', json: async () => ({}) }
		})

	const { container } = render(<GamePage />)

	const firstCell = container.querySelector('g')
	fireEvent.click(firstCell!)

	// Se debe atrapar el error, mostrar el mensaje del backend
	await waitFor(() => {
		expect(screen.getByText('Movimiento inválido')).toBeInTheDocument()
	})
})

it('debe mostrar error si falla el swap', async () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })

		; (global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					game_over: false,
					winner: null,
					state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' },
				}),
			})
			.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: 'Swap inválido' }),
			})

	const { container } = render(<GamePage />)
	const firstCell = container.querySelector('g')
	fireEvent.click(firstCell!)

	const swapButton = await screen.findByRole('button', { name: /game\.swap/i })
	fireEvent.click(swapButton)

	await waitFor(() => {
		expect(screen.getByText('Swap inválido')).toBeInTheDocument()
	})
})

it('debe mostrar el ganador correcto cuando finaliza el juego (Gana Player 1)', async () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })

		; (global.fetch as Mock).mockImplementation(async (url) => {
			if (String(url).includes('/move')) {
				return {
					ok: true,
					json: async () => ({
						game_over: true,
						winner: 'B',
						state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/BB/...' },
					}),
				}
			}
			return { ok: true, text: async () => 'OK', json: async () => ({}) }
		})

	const { container } = render(<GamePage />)
	const firstCell = container.querySelector('g')
	fireEvent.click(firstCell!)

	await waitFor(() => {
        expect(screen.getByText('game.dialog.pvpTitle')).toBeInTheDocument()
    })
})

it('debe mostrar el ganador correcto cuando el Bot gana (Gana R en modo bot)', async () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'bot' } })

		; (global.fetch as Mock).mockImplementation(async (url) => {
			if (String(url).includes('/status')) return { ok: true, text: async () => 'OK' }
			if (String(url).includes('/move')) {
				return {
					ok: true,
					json: async () => ({
						game_over: true,
						winner: 'R',
						state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'R/RR/...' },
					}),
				}
			}
			return { ok: true, text: async () => 'OK', json: async () => ({}) }
		})

	const { container } = render(<GamePage />)
	const firstCell = container.querySelector('g')

	// Al ser modo bot, esperamos que complete el fetch a status
	await waitFor(() => expect(screen.queryByText('Game service is unavailable.')).not.toBeInTheDocument())

	fireEvent.click(firstCell!)

	// Aumentamos el timeout del waitFor porque el modo bot tiene un delay artificial (botDelayMs = 700)
	await waitFor(() => {
        expect(screen.getByText('game.dialog.lostTitle')).toBeInTheDocument()
    }, { timeout: 2000 })
})

it('no debe hacer la petición si se hace clic en una celda ya ocupada', async () => {
	; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })

		; (global.fetch as Mock).mockImplementation(async (url) => {
			if (String(url).includes('/move')) {
				return {
					ok: true,
					json: async () => ({
						game_over: false,
						winner: null,
						state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' }, // La celda ya tiene 'B'
					}),
				}
			}
			return { ok: true, text: async () => 'OK', json: async () => ({}) }
		})

	const { container } = render(<GamePage />)
	const firstCell = container.querySelector('g')

	// Primer clic: realiza la jugada
	fireEvent.click(firstCell!)

	// Como es modo PvP, SOLO hace un fetch() a /move (status se ignora)
	await waitFor(() => {
		expect(global.fetch).toHaveBeenCalledTimes(1)
	})

	// Segundo clic: sobre la misma celda (que ahora es 'B' en nuestro estado)
	fireEvent.click(firstCell!)

	// El contador de llamadas a fetch debe seguir en 1 (el click fue bloqueado)
	expect(global.fetch).toHaveBeenCalledTimes(1)
	})

	// ─── Undo ────────────────────────────────────────────────────────────────────

	it('no debe mostrar el botón Undo al inicio de la partida (historial vacío)', () => {
		; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })

		render(<GamePage />)

		expect(screen.getByRole('button', { name: /game\.undo/i })).toBeDisabled()
	})

	it('debe mostrar el botón Undo tras realizar un movimiento en PvP', async () => {
		; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })
		; (global.fetch as Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				game_over: false,
				winner: null,
				state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' },
			}),
		})

		const { container } = render(<GamePage />)
		fireEvent.click(container.querySelector('g')!)

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /game\.undo/i })).toBeInTheDocument()
		})
	})

	it('debe mostrar el botón Undo deshabilitado mientras el bot está pensando', async () => {
		; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'bot' } })
		; (global.fetch as Mock).mockImplementation(async (url) => {
			if (String(url).includes('/status')) return { ok: true, text: async () => 'OK' }
			if (String(url).includes('/move')) {
				await new Promise((r) => setTimeout(r, 200))
				return {
					ok: true,
					json: async () => ({
						game_over: false,
						winner: null,
						state: { size: 3, turn: 0, players: ['B', 'R'], layout: 'B/../R.' },
					}),
				}
			}
			return { ok: true, text: async () => 'OK', json: async () => ({}) }
		})

		const { container } = render(<GamePage />)
		await waitFor(() =>
			expect(screen.queryByText('game.serviceUnavailable')).not.toBeInTheDocument(),
		)

		fireEvent.click(container.querySelector('g')!)

		await waitFor(() => {
			const undoBtn = screen.getByRole('button', { name: /game\.undo/i })
			expect(undoBtn).toBeDisabled()
		})
	})

	it('debe ocultar el botón Undo después de deshacer el único movimiento', async () => {
		; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })
		; (global.fetch as Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				game_over: false,
				winner: null,
				state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' },
			}),
		})

		const { container } = render(<GamePage />)
		fireEvent.click(container.querySelector('g')!)

		await waitFor(() =>
			expect(screen.getByRole('button', { name: /game\.undo/i })).not.toBeDisabled(),
		)

		fireEvent.click(screen.getByRole('button', { name: /game\.undo/i }))

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /game\.undo/i })).toBeDisabled()
		})
	})

	it('debe permitir deshacer varios movimientos en PvP hasta vaciar el historial', async () => {
		; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })
		; (global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					game_over: false,
					winner: null,
					state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' },
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					game_over: false,
					winner: null,
					state: { size: 3, turn: 0, players: ['B', 'R'], layout: 'B/BR/...' },
				}),
			})

		const { container } = render(<GamePage />)
		const cells = container.querySelectorAll('g')

		fireEvent.click(cells[0])
		await waitFor(() => {
			const player2Label = screen.getByText('game.player2')
			expect(player2Label.parentElement).toHaveTextContent('game.turn')
		})

		fireEvent.click(cells[1])
		await waitFor(() => {
			const player1Label = screen.getByText('game.player1')
			expect(player1Label.parentElement).toHaveTextContent('game.turn')
		})

		fireEvent.click(screen.getByRole('button', { name: /game\.undo/i }))
		await waitFor(() => {
			const player2Label = screen.getByText('game.player2')
			expect(player2Label.parentElement).toHaveTextContent('game.turn')
		})

		fireEvent.click(screen.getByRole('button', { name: /game\.undo/i }))
		await waitFor(() => {
			const player1Label = screen.getByText('game.player1')
			expect(player1Label.parentElement).toHaveTextContent('game.turn')
			expect(screen.getByRole('button', { name: /game\.undo/i })).toBeDisabled()
		})
	})

	it('debe deshacer el movimiento del usuario y la respuesta del bot juntos en modo bot', async () => {
		; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'bot' } })
		; (global.fetch as Mock).mockImplementation(async (url) => {
			if (String(url).includes('/status')) return { ok: true, text: async () => 'OK' }
			if (String(url).includes('/move')) {
				return {
					ok: true,
					json: async () => ({
						game_over: false,
						winner: null,
						state: { size: 3, turn: 0, players: ['B', 'R'], layout: 'B/RR/...' },
					}),
				}
			}
			return { ok: true, text: async () => 'OK', json: async () => ({}) }
		})

		const { container } = render(<GamePage />)
		await waitFor(() =>
			expect(screen.queryByText('game.serviceUnavailable')).not.toBeInTheDocument(),
		)

		fireEvent.click(container.querySelector('g')!)
		fireEvent.click(screen.getByRole('button', { name: /game\.undo/i }))

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /game\.undo/i })).toBeDisabled()
		})
	})

	it('debe poder deshacer después de aplicar la pie rule en PvP', async () => {
		; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })
		; (global.fetch as Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					game_over: false,
					winner: null,
					state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' },
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					game_over: false,
					winner: null,
					state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'R/../...' },
				}),
			})

		const { container } = render(<GamePage />)
		fireEvent.click(container.querySelector('g')!)

		const swapBtn = await screen.findByRole('button', { name: /Swap/i })
		fireEvent.click(swapBtn)

		await waitFor(() =>
			expect(screen.getByRole('button', { name: /game\.undo/i })).toBeInTheDocument(),
		)

		fireEvent.click(screen.getByRole('button', { name: /game\.undo/i }))

		// Tras deshacer el swap se restaura el turno previo (Player 2 antes del swap)
		await waitFor(() => {
			// Solución: Verificamos en la UI que la tarjeta de 'Player 2' tiene la etiqueta 'Turn'
			const player2Label = screen.getByText('game.player2')
			expect(player2Label.parentElement).toHaveTextContent('game.turn')
		})
	})

	it('debe limpiar el historial de undo al hacer "New Game"', async () => {
		; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })
		; (global.fetch as Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				game_over: false,
				winner: null,
				state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/../...' },
			}),
		})

		const { container } = render(<GamePage />)
		fireEvent.click(container.querySelector('g')!)

		// Comprobamos que el botón Undo se ha HABILITADO tras el movimiento
		await waitFor(() =>
			expect(screen.getByRole('button', { name: /game\.undo/i })).not.toBeDisabled(),
		)

		fireEvent.click(screen.getByRole('button', { name: /game\.newGame/i }))

		// Al hacer "New Game", el botón Undo debe quedar deshabilitado
		await waitFor(() => {
			expect(screen.getByRole('button', { name: /game\.undo/i })).toBeDisabled()
		})
	})

	it('no debe mostrar el botón Undo cuando hay ganador', async () => {
		; (useSession as Mock).mockReturnValue({ isLoggedIn: true })
		; (useLocation as Mock).mockReturnValue({ state: { mode: 'pvp' } })
		; (global.fetch as Mock).mockImplementation(async (url) => {
			if (String(url).includes('/move')) {
				return {
					ok: true,
					json: async () => ({
						game_over: true,
						winner: 'B',
						state: { size: 3, turn: 1, players: ['B', 'R'], layout: 'B/BB/...' },
					}),
				}
			}
			return { ok: true, text: async () => 'OK', json: async () => ({}) }
		})

		const { container } = render(<GamePage />)
		fireEvent.click(container.querySelector('g')!)

		await waitFor(() => {
			expect(screen.getByText('game.dialog.pvpTitle')).toBeInTheDocument()
		})

		expect(screen.queryByRole('button', { name: /game\.undo/i })).not.toBeInTheDocument()
	})
})