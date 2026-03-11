import { useEffect, useState } from 'react'
import { Alert, Box, Button, Paper, Typography } from '@mui/material'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from "../SessionContext";

const apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const boardSize = 5
const botDelayMs = 700

const cellRadius = 22
const horizontalGap = 68
const verticalGap = 58
const svgPadding = 40

type Cell = '.' | 'B' | 'R'
type Board = Cell[][]
type Winner = 'B' | 'R' | null
interface MoveTurnResponse {
  game_over: boolean
  winner: Winner
  state: {
    size: number
    turn: number
    players: string[]
    layout: string
  }
}

type GameMode = 'pvp' | 'bot'

function makeEmptyBoard(): Board {
  return Array.from({ length: boardSize }, (_, row) => Array.from({ length: row + 1 }, () => '.' as Cell))
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row])
}

function toYen(board: Board) {
  return {
    size: board.length,
    turn: 0,
    players: ['B', 'R'],
    layout: board.map((row) => row.join('')).join('/'),
  }
}

function getPosition(row: number, col: number) {
  const rowWidth = row * horizontalGap
  const x = svgPadding + ((boardSize - 1) * horizontalGap) / 2 - rowWidth / 2 + col * horizontalGap
  const y = svgPadding + row * verticalGap
  return { x, y }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function boardFromLayout(size: number, layout: string): Board {
  const rows = layout.split('/')
  const board: Board = []

  for (let row = 0; row < size; row++) {
    const rowChars = rows[row]?.split('') ?? []
    const cells: Cell[] = []
    for (let col = 0; col <= row; col++) {
      const value = rowChars[col]
      cells.push(value === 'B' || value === 'R' ? value : '.')
    }
    board.push(cells)
  }

  return board
}

export default function GamePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAvailable, setIsAvailable] = useState(true)
  const [board, setBoard] = useState<Board>(makeEmptyBoard())
  const [busy, setBusy] = useState(false)
  const [winner, setWinner] = useState<Winner>(null)
  const mode = (location.state as { mode?: GameMode } | null)?.mode ?? 'bot'
  const [currentPlayer, setCurrentPlayer] = useState<'B' | 'R'>('B')
  const [message, setMessage] = useState(mode === 'pvp' ? 'Player B turn.' : 'Your turn. Place a blue piece.')
  const [error, setError] = useState('')

  const { isLoggedIn } = useSession();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (mode === 'pvp') {
          setIsAvailable(true)
          return
        }
        const response = await fetch(`${apiEndpoint}/game/status`)
        const text = response.ok ? await response.text() : ''
        setIsAvailable(response.ok && text === 'OK')
      } catch (e) {
        setIsAvailable(false)
      }
    }

    checkStatus()
  }, [mode])

  const play = async (row: number, col: number) => {
    if (!isAvailable || busy || winner !== null || board[row][col] !== '.') {
      if (!isAvailable) {
        setError('Game service is unavailable.')
      }
      return
    }

    setError('')
    setBusy(true)
    const previousBoard = cloneBoard(board)
    const optimisticBoard = cloneBoard(board)
    optimisticBoard[row][col] = mode === 'pvp' ? currentPlayer : 'B'
    setBoard(optimisticBoard)

    try {
      setMessage(mode === 'pvp' ? 'Processing move...' : 'Bot is thinking...')

      const payload: Record<string, unknown> = {
        state: toYen(previousBoard),
        row,
        col,
        mode,
      }
      if (mode === 'bot') {
        payload.bot_id = 'random_bot'
      }

      const response = await fetch(`${apiEndpoint}/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to process move')
      }

      if (mode === 'bot') {
        await delay(botDelayMs)
      }

      const moveData = data as MoveTurnResponse
      const updated = boardFromLayout(moveData.state.size, moveData.state.layout)
      setBoard(updated)

      if (moveData.game_over && moveData.winner) {
        setWinner(moveData.winner)
        if (moveData.winner === 'B') {
          setMessage(mode === 'pvp' ? 'Player B wins.' : 'You win.')
        } else {
          setMessage(mode === 'pvp' ? 'Player R wins.' : 'Bot wins.')
        }
      } else {
        setWinner(null)
        if (mode === 'pvp') {
          const nextPlayer = moveData.state.turn === 0 ? 'B' : 'R'
          setCurrentPlayer(nextPlayer)
          setMessage(`Player ${nextPlayer} turn.`)
        } else {
          setMessage('Your turn. Place a blue piece.')
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setBoard(previousBoard)
      setError(msg)
      setMessage(mode === 'pvp' ? 'Your move could not be completed.' : 'Your move could not be completed against the bot.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setBoard(makeEmptyBoard())
    setBusy(false)
    setWinner(null)
    setCurrentPlayer('B')
    setError('')
    setMessage(mode === 'pvp' ? 'Player B turn.' : 'Your turn. Place a blue piece.')
  }

  const svgWidth = svgPadding * 2 + (boardSize - 1) * horizontalGap
  const svgHeight = svgPadding * 2 + (boardSize - 1) * verticalGap
  const top = getPosition(0, 0)
  const left = getPosition(boardSize - 1, 0)
  const right = getPosition(boardSize - 1, boardSize - 1)

  return (
    <div className="main-content">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 900, width: '100%' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Game Y - {mode === 'pvp' ? 'Player vs Player' : 'Player vs Bot'}
        </Typography>

        <Alert severity={error ? 'warning' : 'info'} sx={{ mb: 3 }}>
          {error || message}
        </Alert>

        <Box sx={{ mb: 4, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 3, border: '1px solid #d7d7d7', p: 2 }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" role="img" aria-label="Y game board">
              <line x1={top.x} y1={top.y - 20} x2={left.x - 22} y2={left.y + 12} stroke="#2e7d32" strokeWidth="6" strokeLinecap="round" />
              <line x1={left.x - 22} y1={left.y + 12} x2={right.x + 22} y2={right.y + 12} stroke="#2e7d32" strokeWidth="6" strokeLinecap="round" />
              <line x1={right.x + 22} y1={right.y + 12} x2={top.x} y2={top.y - 20} stroke="#2e7d32" strokeWidth="6" strokeLinecap="round" />

              {board.map((row, rowIndex) =>
                row.map((cell, cellIndex) => {
                  const { x, y } = getPosition(rowIndex, cellIndex)
                  const clickable = isAvailable && !busy && winner === null && cell === '.'
                  const fill = cell === 'B' ? '#1565c0' : cell === 'R' ? '#c62828' : '#fffaf0'

                  return (
                    <g
                      key={`${rowIndex}-${cellIndex}`}
                      onClick={() => {
                        if (clickable) {
                          void play(rowIndex, cellIndex)
                        }
                      }}
                      style={{ cursor: clickable ? 'pointer' : 'default' }}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={cellRadius}
                        fill={fill}
                        stroke={clickable ? '#2e7d32' : '#4e3d20'}
                        strokeWidth={clickable ? 3 : 2}
                      />
                    </g>
                  )
                })
              )}
            </svg>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={reset}>
            New Game
          </Button>
          <Button variant="outlined" onClick={() => navigate('/homepage')}>
            Back to Home
          </Button>
        </Box>
      </Paper>
    </div>
  )
}
