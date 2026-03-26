import { useEffect, useState } from 'react'
import { Alert, Box, Button, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from "../SessionContext";
import TrophyIcon from '@mui/icons-material/EmojiEvents';
import ErrorIcon from '@mui/icons-material/SentimentVeryDissatisfied';

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
type GameMode = 'pvp' | 'bot'
type Difficulty = 'Easy' | 'Medium' | 'Hard'

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
  const [startTime, setStartTime] = useState<number | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const state = location.state as { mode?: GameMode; bot_id?: string; difficulty?: Difficulty } | null
  const mode = state?.mode ?? 'bot'
  const difficulty = state?.difficulty ?? 'Medium'
  const bot_id     = state?.bot_id     ?? 'random_bot'
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
    // Iniciar cronómetro en el primer movimiento
    if (!startTime) {
      setStartTime(Date.now())
    }

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
        payload.bot_id = bot_id
        payload.difficulty = difficulty
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

      if (moveData.game_over) {
        const finalWinner = moveData.winner;
        setWinner(finalWinner);
        setIsGameOver(true);

        // Calcular duración y guardar partida
        const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        const username = localStorage.getItem('username') || 'anonymous';

        void fetch(`${apiEndpoint}/game/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: username,
            rival: mode === 'pvp' ? 'multiplayer' : 'bot',
            level: difficulty,
            duration: duration,
            result: finalWinner === 'B' ? 'won' : 'lost'
          })
        });
        
        if (finalWinner === 'B') {
          setMessage(mode === 'pvp' ? 'Player B wins.' : 'You win.')
        } else if (finalWinner === 'R') {
          setMessage(mode === 'pvp' ? 'Player R wins.' : 'Bot wins.')
        } else {
          setMessage('Game Over.')
        }
      } else {
        setWinner(null)
        setIsGameOver(false);
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
    setStartTime(null)
    setIsGameOver(false)
    setCurrentPlayer('B')
    setError('')
    setMessage(mode === 'pvp' ? 'Player B turn.' : 'Your turn. Place a blue piece.')
  }

  const svgWidth = svgPadding * 2 + (boardSize - 1) * horizontalGap
  const svgHeight = svgPadding * 2 + (boardSize - 1) * verticalGap
  const top = getPosition(0, 0)
  const left = getPosition(boardSize - 1, 0)
  const right = getPosition(boardSize - 1, boardSize - 1)

  // Lógica para el contenido del diálogo de fin de partida
  const isPvP = mode === 'pvp';
  const userWon = winner === 'B';
  const dialogTitle = isPvP 
    ? `Player ${winner === 'B' ? 'B' : 'R'} wins!` 
    : (userWon ? 'Congratulations, you won!' : 'Oh no! The bot won');
  
  const accentColor = isPvP 
    ? (winner === 'B' ? '#1565c0' : '#c62828') 
    : (userWon ? '#2e7d32' : '#d32f2f');

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

      {/* Diálogo de Fin de Partida */}
      <Dialog 
        open={isGameOver} 
        onClose={reset}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              p: 2,
              textAlign: 'center',
              minWidth: 320,
              border: `2px solid ${accentColor}`
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', color: accentColor }}>
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center">
            {/* Imagen/Icono dinámico según resultado en modo Bot */}
            {!isPvP && (
              <Box sx={{ mt: 2 }}>
                {userWon ? (
                  <TrophyIcon sx={{ fontSize: 80, color: '#fbc02d' }} />
                ) : (
                  <ErrorIcon sx={{ fontSize: 80, color: '#d32f2f' }} />
                )}
              </Box>
            )}
            <Typography variant="body1" color="text.secondary">
              {isPvP 
                ? `The game has ended. Player ${winner === 'B' ? 'blue' : 'red'} wins.`
                : (userWon 
                    ? 'You outsmarted the bot. Great play!' 
                    : 'The bot was smarter this time. Wanna try again?')
              }
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
          <Button variant="contained" onClick={reset} sx={{ bgcolor: accentColor, '&:hover': { bgcolor: accentColor, opacity: 0.9 } }}>
            Try again
          </Button>
          <Button variant="outlined" onClick={() => navigate('/homepage')} color="inherit">
            Go Home
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
