import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Box, Button, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from "../SessionContext";
import TrophyIcon from '@mui/icons-material/EmojiEvents';
import ErrorIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import { getInitialBoardSize } from "./GameSetup";

const apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const botDelayMs = 700

// Constantes de dimensiones
const hexRadius = 38
const horizontalGap = 68
const verticalGap = 58
const svgPadding = 60


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


function makeEmptyBoard(size: number): Board {
  return Array.from({ length: size }, (_, row) => Array.from({ length: row + 1 }, () => '.' as Cell))
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

function getPosition(row: number, col: number, size: number) {
  const rowWidth = row * horizontalGap
  const x = svgPadding + ((size - 1) * horizontalGap) / 2 - rowWidth / 2 + col * horizontalGap
  const y = svgPadding + row * verticalGap
  return { x, y }
}

function getHexagonPoints(cx: number, cy: number, r: number) {
  const w = r * (Math.sqrt(3) / 2)
  return `
    ${cx},${cy - r} 
    ${cx + w},${cy - r / 2} 
    ${cx + w},${cy + r / 2} 
    ${cx},${cy + r} 
    ${cx - w},${cy + r / 2} 
    ${cx - w},${cy - r / 2}
  `.trim()
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
  const { t } = useTranslation()
  
  // Usamos directamente la función por referencia para inicializar el estado
  const [boardSize] = useState(getInitialBoardSize) // El setBoardSize se eliminado ya que no esta en uso por ahora.
  
  const [isAvailable, setIsAvailable] = useState(true)
  const [board, setBoard] = useState<Board>(makeEmptyBoard(boardSize))
  const [busy, setBusy] = useState(false)
  const [winner, setWinner] = useState<Winner>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const state = location.state as { mode?: GameMode; bot_id?: string; difficulty?: Difficulty } | null
  const mode = state?.mode ?? 'bot'
  const difficulty = state?.difficulty ?? 'Medium'
  const bot_id     = state?.bot_id     ?? 'random_bot'
  const [currentPlayer, setCurrentPlayer] = useState<'B' | 'R'>('B')
  const [message, setMessage] = useState(mode === 'pvp' ? t('game.playerTurn', { player: '1' }) : t('game.yourTurn'))
  const [error, setError] = useState('')
  const { isLoggedIn } = useSession();
  

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

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const play = async (row: number, col: number) => {
    if (!isAvailable || busy || winner !== null || board[row][col] !== '.') {
      if (!isAvailable) {
        setError(t('game.serviceUnavailable'))
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
      setMessage(mode === 'pvp' ? t('game.processingMove') : t('game.botThinking'))

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
        throw new Error(data.error || t('game.unableMove'))
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
          setMessage(mode === 'pvp' ? t('game.playerWins', { player: '1' }) : t('game.youWin'))
        } else if (finalWinner === 'R') {
          setMessage(mode === 'pvp' ? t('game.playerWins', { player: '2' }) : t('game.botWins'))
        } else {
          setMessage(t('game.gameOver'))
        }
      } else {
        setWinner(null)
        setIsGameOver(false);
        if (mode === 'pvp') {
          const nextPlayer = moveData.state.turn === 0 ? 'B' : 'R'
          setCurrentPlayer(nextPlayer)
          setMessage(t('game.playerTurn', { player: nextPlayer === 'B' ? '1' : '2' }))
        } else {
          setMessage(t('game.yourTurn'))
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('game.unknownError')
      setBoard(previousBoard)
      setError(msg)
      setMessage(mode === 'pvp' ? t('game.unablePvp') : t('game.unableBot'))
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setBoard(makeEmptyBoard(boardSize))
    setBusy(false)
    setWinner(null)
    setStartTime(null)
    setIsGameOver(false)
    setCurrentPlayer('B')
    setError('')
    setMessage(mode === 'pvp' ? t('game.playerTurn', { player: '1' }) : t('game.yourTurn'))
  }

  /* Actualmente sin usar, para usar importar minBoardSize y maxBoardSize de GameSetup
  const handleSizeChange = (newSize: number) => {
    if (newSize >= minBoardSize && newSize <= maxBoardSize) {
      setBoardSize(newSize)
      sessionStorage.setItem('boardSize', newSize.toString())
      setBoard(makeEmptyBoard(newSize))
      setBusy(false)
      setWinner(null)
      setCurrentPlayer('B')
      setError('')
      setMessage(mode === 'pvp' ? 'Player 1 turn.' : 'Your turn. Place a piece.')
    }
  }
  */

  const svgWidth = svgPadding * 2 + (boardSize - 1) * horizontalGap
  const svgHeight = svgPadding * 2 + (boardSize - 1) * verticalGap

  // Lógica para el contenido del diálogo de fin de partida
  const isPvP = mode === 'pvp';
  const userWon = winner === 'B';
  const dialogTitle = isPvP 
    ? t('game.dialog.pvpTitle', { player: winner === 'B' ? 'blue' : 'red' })
    : (userWon ? t('game.dialog.wonTitle') : t('game.dialog.lostTitle'));
  
  const accentColor = isPvP 
    ? (winner === 'B' ? '#1565c0' : '#c62828') 
    : (userWon ? '#2e7d32' : '#d32f2f');

  const dialogBody = isPvP 
    ? t('game.dialog.pvpBody', { color: winner === 'B' ? t('game.dialog.blue') : t('game.dialog.red') })
    : (userWon ? t('game.dialog.wonBody') : t('game.dialog.lostBody'));

  return (
    <div className="main-content">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 900, width: '100%' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          {mode === 'pvp' ? t('game.titlePvp') : t('game.titleBot')}
        </Typography>

        <Alert severity={error ? 'warning' : 'info'} sx={{ mb: 3 }}>
          {error || message}
        </Alert>

        <Box sx={{ mb: 4, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 560, background: '#ffffff', p: 2 }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" role="img" aria-label={t('game.boardAriaLabel')}>

              {board.map((row, rowIndex) =>
                row.map((cell, cellIndex) => {
                  const { x, y } = getPosition(rowIndex, cellIndex, boardSize)
                  const clickable = !busy && winner === null && cell === '.'
                  
                  let fill = 'var(--yovi-board-hex-default)';
                  if (cell === 'B') {
                    fill = 'var(--yovi-board-hex-playerB)';
                  } else if (cell === 'R') {
                    fill = 'var(--yovi-board-hex-playerR)';
                  }
                  const strokeColor = 'var(--yovi-board-border)'
                  
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
                      <polygon
                        points={getHexagonPoints(x, y, hexRadius)}
                        fill={fill}
                        stroke={strokeColor}
                        strokeWidth={6}
                        style={{ 
                          transition: 'fill 0.2s',
                          filter: cell === '.' ? 'drop-shadow(inset 0px 3px 3px rgba(0,0,0,0.3))' : 'none' 
                        }}
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
            {t('game.newGame')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/homepage')}>
            {t('game.backToHome')}
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
              {dialogBody}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
          <Button variant="contained" onClick={reset} sx={{ bgcolor: accentColor, '&:hover': { bgcolor: accentColor, opacity: 0.9 } }}>
            {t('game.tryAgain')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/homepage')} color="inherit">
            {t('game.goHome')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}