import { render, screen,  waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from "../components/RegisterForm";
import { afterEach, describe, expect, test, vi } from 'vitest' 
import '@testing-library/jest-dom'


describe('RegisterForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('shows validation error when username is empty', async () => {
    render(<RegisterForm />)
    const user = userEvent.setup()

    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /lets go!/i }))
      expect(screen.getByText(/please enter a username/i)).toBeInTheDocument()
    })
  })

  test('submits username, displays response, and calls onRegistered', async () => {
    const user = userEvent.setup()
    const onRegistered = vi.fn()

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Hello Pablo! Welcome to the course!' }),
    } as Response)

    render(<RegisterForm onRegistered={onRegistered} />)

    await waitFor(async () => {
      await user.type(screen.getByLabelText(/whats your name\?/i), 'Pablo')
      await user.click(screen.getByRole('button', { name: /lets go!/i }))

      expect(
        screen.getByText(/hello pablo! welcome to the course!/i)
      ).toBeInTheDocument()

      // ✅ NUEVO: se llama al callback
      expect(onRegistered).toHaveBeenCalledWith('Pablo')
    })
  })
})