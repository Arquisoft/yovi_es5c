import { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
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
type ServiceStatus = 'checking' | 'online' | 'offline'
type Winner = 'B' | 'R' | null

function makeEmptyBoard(): Board {
  return Array.from({ length: boardSize }, (_, row) => Array.from({ length: row + 1 }, () => '.' as Cell))
}

function copyBoard(board: Board): Board {
  return board.map((row) => [...row])
}

function toYen(board: Board) {
  return {
    size: board.length,
    turn: 1, // bot (R) moves after player (B)
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

function isFull(board: Board) {
  return board.every((row) => row.every((cell) => cell !== '.'))
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function evaluateWinner(board: Board): Promise<Winner> {
  const response = await fetch(`${apiEndpoint}/game/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toYen(board)),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Unable to evaluate game status')
  }

  if (!data.game_over) {
    return null
  }

  return data.winner === 'B' || data.winner === 'R' ? data.winner : null
}

export default function GamePage() {
  const navigate = useNavigate()
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking')
  const [serviceMessage, setServiceMessage] = useState('Checking game service status...')
  const [board, setBoard] = useState<Board>(makeEmptyBoard())
  const [busy, setBusy] = useState(false)
  const [winner, setWinner] = useState<Winner>(null)
  const [message, setMessage] = useState('Your turn. Place a blue piece.')
  const [error, setError] = useState('')

  const { isLoggedIn } = useSession();

  if (!isLoggedIn) {
    navigate('/login');
  }

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiEndpoint}/game/status`)
        if (!response.ok) {
          throw new Error(`Gateway returned ${response.status}`)
        }
        const text = await response.text()
        if (text === 'OK') {
          setServiceStatus('online')
          setServiceMessage('Gamey service is available.')
        } else {
          setServiceStatus('offline')
          setServiceMessage(`Unexpected response: ${text}`)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        setServiceStatus('offline')
        setServiceMessage(`Gamey service is not reachable: ${msg}`)
      }
    }

    checkStatus()
  }, [])

  const play = async (row: number, col: number) => {
    if (serviceStatus !== 'online' || busy || winner !== null || board[row][col] !== '.') {
      return
    }

    setError('')
    setBusy(true)

    const playerBoard = copyBoard(board)
    playerBoard[row][col] = 'B'
    setBoard(playerBoard)

    try {
      const playerWinner = await evaluateWinner(playerBoard)
      if (playerWinner === 'B') {
        setWinner('B')
        setMessage('You win.')
        return
      }

      if (isFull(playerBoard)) {
        setMessage('Board full. Start a new game.')
        return
      }

      setMessage('Bot is thinking...')

      const response = await fetch(`${apiEndpoint}/game/bot/choose/random_bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toYen(playerBoard)),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to get bot move')
      }

      await delay(botDelayMs)

      const botRow = boardSize - 1 - data.coords.x
      const botCol = data.coords.y

      if (!playerBoard[botRow] || playerBoard[botRow][botCol] !== '.') {
        throw new Error('Bot returned an invalid or occupied position')
      }

      const updated = copyBoard(playerBoard)
      updated[botRow][botCol] = 'R'
      setBoard(updated)

      const botWinner = await evaluateWinner(updated)
      if (botWinner === 'R') {
        setWinner('R')
        setMessage('Bot wins.')
      } else if (isFull(updated)) {
        setMessage('Board full. Start a new game.')
      } else {
        setMessage('Your turn. Place a blue piece.')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      setMessage('Your move could not be completed against the bot.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setBoard(makeEmptyBoard())
    setBusy(false)
    setWinner(null)
    setError('')
    setMessage('Your turn. Place a blue piece.')
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
          Game Y - V1
        </Typography>

        <Box sx={{ mb: 3 }}>
          {serviceStatus === 'checking' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">{serviceMessage}</Typography>
            </Box>
          ) : (
            <Alert severity={serviceStatus === 'online' ? 'success' : 'error'}>{serviceMessage}</Alert>
          )}
        </Box>

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
                  const clickable = serviceStatus === 'online' && !busy && winner === null && cell === '.'
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
