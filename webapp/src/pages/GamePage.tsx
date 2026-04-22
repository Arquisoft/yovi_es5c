import { useEffect, useState } from 'react'
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

function toYen(board: Board, currentPlayer: 'B' | 'R') {
  return {
    size: board.length,
    turn: currentPlayer === 'B' ? 0 : 1,
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

function getBotLabel(botId: string): string {
  const labels: Record<string, string> = {
    random_bot: "Random Bot",
    center_bot: "Center bot",
    edge_bot: "Edge Bot",
    smart_bot: "Smart Bot",
    mirror_bot: "Mirror Bot",
    alpha_bot: "Alpha Bot",
  };
  return labels[botId] || botId;
}

function getDialogTitle(isPvP: boolean, winner: Winner, userWon: boolean): string {
  if (isPvP) {
    return `Player ${winner === 'B' ? 'B' : 'R'} wins!`
  }
  if (userWon) return 'Congratulations, you won!'
  return 'Oh no! The bot won'
}

function getAccentColor(isPvP: boolean, winner: Winner, userWon: boolean): string {
  if (isPvP) {
    return winner === 'B' ? '#1565c0' : '#c62828'
  }
  return userWon ? '#2e7d32' : '#d32f2f'
}

function getDialogMessage(isPvP: boolean, winner: Winner, userWon: boolean): string {
  if (isPvP) {
    return `The game has ended. Player ${winner === 'B' ? 'blue' : 'red'} wins.`
  }
  if (userWon) return 'You outsmarted the bot. Great play!'
  return 'The bot was smarter this time. Wanna try again?'
}

function countPieces(board: Board): number {
  return board.reduce(
    (total, row) => total + row.filter((cell) => cell !== '.').length,
    0,
  )
}

function getTouchedSides(board: Board, color: 'B' | 'R') {
  const size = board.length
  let touchesA = false
  let touchesB = false
  let touchesC = false

  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= row; col++) {
      if (board[row][col] !== color) {
        continue
      }

      const x = size - 1 - row
      const y = col
      const z = row - col

      if (x === 0) {
        touchesA = true
      }
      if (y === 0) {
        touchesB = true
      }
      if (z === 0) {
        touchesC = true
      }
    }
  }

  return { touchesA, touchesB, touchesC }
}

function getTriangleVertices(size = 74) {
  const height = size * 0.86
  return {
    top: { x: size / 2, y: 8 },
    left: { x: 10, y: height },
    right: { x: size - 10, y: height },
    width: size,
    height: height + 10,
  }
}

export default function GamePage() {
  const navigate = useNavigate()
  const location = useLocation()
  
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
  const [playerOneColor, setPlayerOneColor] = useState<'B' | 'R'>('B')
  const [playerTwoColor, setPlayerTwoColor] = useState<'B' | 'R'>('R')
  const [message, setMessage] = useState(mode === 'pvp' ? 'Player 1 turn.' : 'Your turn. Place a piece.')
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
      } catch (e:unknown) {
          if (e instanceof Error) {
            console.log(e.message)
          }
          setIsAvailable(false)
      }
    }

    checkStatus()
  }, [mode])

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  const validateMove = (row: number, col: number) => {
    if (!isAvailable) {
      setError('Game service is unavailable.')
      return false
    }

    if (busy || winner !== null || board[row][col] !== '.') {
      return false
    }

    return true
  }

  const buildPayload = (previousBoard: any, row: number, col: number) => {
  const payload: Record<string, unknown> = {
    state: toYen(previousBoard,currentPlayer),
    row,
    col,
    mode,
  }

  if (mode === 'bot') {
    payload.bot_id = bot_id
    payload.difficulty = difficulty
  }

  return payload
}
  const handleGameOver = (winner: Winner) => {
        setWinner(winner);
        setIsGameOver(true);

        // Calcular duración y guardar partida
        const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        const username = localStorage.getItem('username') || 'anonymous';

        void fetch(`${apiEndpoint}/game/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: username,
            rival: mode === 'pvp' ? 'multiplayer' : bot_id,
            level: difficulty,
            duration: duration,
            result: winner === 'B' ? 'won' : 'lost'
          })
        });
        
        if (winner === 'B') {
          setMessage(mode === 'pvp' ? 'Player 1 wins.' : 'You win.')
        } else if (winner === 'R') {
          setMessage(mode === 'pvp' ? 'Player 2 wins.' : `${getBotLabel(bot_id)} wins.`)
        } else {
          setMessage('Game Over.')
        }

  }

  const handleNextTurn = (moveData: MoveTurnResponse) => {
  setWinner(null)
  setIsGameOver(false)

  if (mode === 'pvp') {
    const nextPlayer = moveData.state.turn === 0 ? 'B' : 'R'
    setCurrentPlayer(nextPlayer)
    setMessage(`Player ${nextPlayer} turn.`)
  } else {
    setCurrentPlayer('B')
    setMessage('Your turn. Place a piece.')
  }
}

  const getPvpPlayerLabel = (color: 'B' | 'R', p1Color = playerOneColor, p2Color = playerTwoColor) => {
    if (color === p1Color) {
      return 'Player 1'
    }
    if (color === p2Color) {
      return 'Player 2'
    }
    return `Player ${color}`
  }

  const pieceCount = countPieces(board)
  const canUsePieRule =
    mode === 'pvp' &&
    !busy &&
    winner === null &&
    pieceCount === 1 &&
    currentPlayer === playerTwoColor &&
    playerOneColor === 'B' &&
    playerTwoColor === 'R'
  const playerOneActive = currentPlayer === playerOneColor
  const playerTwoActive = currentPlayer === playerTwoColor
  const playerOneLabel = mode === 'pvp' ? 'Player 1' : 'You'
  const playerTwoLabel = mode === 'pvp' ? 'Player 2' : getBotLabel(bot_id)
  const playerOneSides = getTouchedSides(board, playerOneColor)
  const playerTwoSides = getTouchedSides(board, playerTwoColor)

  const renderPlayerTriangle = (
    label: string,
    color: 'B' | 'R',
    isActive: boolean,
    touchedSides: { touchesA: boolean; touchesB: boolean; touchesC: boolean },
  ) => {
    const triangle = getTriangleVertices()
    const stroke = color === 'B' ? '#1565c0' : '#c62828'
    const fill = color === 'B' ? 'rgba(21, 101, 192, 0.14)' : 'rgba(198, 40, 40, 0.14)'
    const winningFill = color === 'B' ? 'rgba(21, 101, 192, 0.82)' : 'rgba(198, 40, 40, 0.82)'
    const inactiveStroke = 'rgba(148, 163, 184, 0.45)'
    const isWinner = winner === color

    return (
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minWidth: 180,
          p: 1.5,
          borderRadius: 3,
          border: `2px solid ${isActive ? stroke : 'rgba(15, 23, 42, 0.14)'}`,
          backgroundColor: '#fff',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {label}
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.35,
              borderRadius: 999,
              bgcolor: isActive ? stroke : 'rgba(15, 23, 42, 0.08)',
              color: isActive ? '#fff' : 'text.secondary',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {isActive ? 'Turn' : 'Waiting'}
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <svg
            width={triangle.width}
            height={triangle.height}
            viewBox={`0 0 ${triangle.width} ${triangle.height}`}
            aria-label={`${label} triangle`}
          >
            <title>{`${label} triangle`}</title>
            <polygon
              points={`${triangle.top.x},${triangle.top.y} ${triangle.left.x},${triangle.left.y} ${triangle.right.x},${triangle.right.y}`}
              fill={isWinner ? winningFill : fill}
              stroke="transparent"
            />
            <line
              x1={triangle.top.x}
              y1={triangle.top.y}
              x2={triangle.left.x}
              y2={triangle.left.y}
              stroke={touchedSides.touchesB ? stroke : inactiveStroke}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <line
              x1={triangle.left.x}
              y1={triangle.left.y}
              x2={triangle.right.x}
              y2={triangle.right.y}
              stroke={touchedSides.touchesA ? stroke : inactiveStroke}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <line
              x1={triangle.right.x}
              y1={triangle.right.y}
              x2={triangle.top.x}
              y2={triangle.top.y}
              stroke={touchedSides.touchesC ? stroke : inactiveStroke}
              strokeWidth={6}
              strokeLinecap="round"
            />
          </svg>
        </Box>
      </Paper>
    )
  }

  const play = async (row: number, col: number) => {
    if (!validateMove(row, col)) return;

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
      const payload = buildPayload(previousBoard, row, col)

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
        setCurrentPlayer('R')
        await delay(botDelayMs)
      }

      const moveData = data as MoveTurnResponse
      const updated = boardFromLayout(moveData.state.size, moveData.state.layout)
      setBoard(updated)

      if (moveData.game_over) {
        const finalWinner = moveData.winner;
        handleGameOver(finalWinner);
      } else {
        handleNextTurn(moveData);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setBoard(previousBoard)
      setError(msg)
      setMessage('Your move could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const swapSides = async () => {
    if (!canUsePieRule) {
      return
    }

    setBusy(true)
    setError('')
    setMessage('Applying pie rule...')

    try {
      const response = await fetch(`${apiEndpoint}/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: toYen(board, currentPlayer),
          action: 'swap',
          mode,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to apply pie rule')
      }

      const moveData = data as MoveTurnResponse
      const updated = boardFromLayout(moveData.state.size, moveData.state.layout)
      const nextPlayer = moveData.state.turn === 0 ? 'B' : 'R'
      const nextPlayerOneColor: 'B' | 'R' = 'R'
      const nextPlayerTwoColor: 'B' | 'R' = 'B'

      setBoard(updated)
      setPlayerOneColor(nextPlayerOneColor)
      setPlayerTwoColor(nextPlayerTwoColor)
      setCurrentPlayer(nextPlayer)
      setMessage(`${getPvpPlayerLabel(nextPlayer, nextPlayerOneColor, nextPlayerTwoColor)} turn.`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      setMessage('The pie rule could not be applied.')
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
    setPlayerOneColor('B')
    setPlayerTwoColor('R')
    setError('')
    setMessage(mode === 'pvp' ? 'Player 1 turn.' : 'Your turn. Place a piece.')
  }

  const svgWidth = svgPadding * 2 + (boardSize - 1) * horizontalGap
  const svgHeight = svgPadding * 2 + (boardSize - 1) * verticalGap

  // Lógica para el contenido del diálogo de fin de partida
  const isPvP = mode === 'pvp';
  const userWon = winner === 'B';
  const dialogTitle = getDialogTitle(isPvP, winner, userWon);

  
  const accentColor = getAccentColor(isPvP, winner, userWon)

  return (
    <div className="main-content">
      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 1080,
          width: '100%',
          borderRadius: 4,
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          border: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Game Y - {mode === 'pvp' ? 'Player vs Player' : 'Player vs Bot'}
        </Typography>

        {error && (
          <Alert severity={error ? 'warning' : 'info'} sx={{ mb: 3 }}>
            {error || message}
          </Alert>
        )}

        <Box
          sx={{
            mb: 4,
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ width: { xs: '100%', lg: 210 }, flexShrink: 0 }}>
            {renderPlayerTriangle(playerOneLabel, playerOneColor, playerOneActive, playerOneSides)}
          </Box>

          <Box sx={{ width: '100%', maxWidth: 560, p: 2 }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" aria-label="Y game board">
              <title>Y game board</title>

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

          <Box sx={{ width: { xs: '100%', lg: 210 }, flexShrink: 0 }}>
            {renderPlayerTriangle(playerTwoLabel, playerTwoColor, playerTwoActive, playerTwoSides)}
            {canUsePieRule && (
              <Button
                variant="contained"
                onClick={swapSides}
                sx={{
                  mt: 1.25,
                  width: '100%',
                  bgcolor: '#f8fafc',
                  color: '#0f172a',
                  '&:hover': { bgcolor: '#e2e8f0' },
                }}
              >
                Swap
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={reset} sx={{ color: '#f8fafc', borderColor: '#f8fafc' }}>
            New Game
          </Button>
          <Button variant="outlined" onClick={() => navigate('/homepage')} sx={{ color: '#f8fafc', borderColor: '#f8fafc' }}>
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
              {getDialogMessage(isPvP, winner, userWon)}
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
