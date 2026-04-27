import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LanguageSwitcher from '../components/LanguageSwitcher'

const mockChangeLanguage = vi.fn<(language: string) => Promise<void>>()
let mockLanguage = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      get language() {
        return mockLanguage
      },
      changeLanguage: mockChangeLanguage.mockImplementation(async (language: string) => {
        mockLanguage = language
      }),
    },
  }),
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockLanguage = 'en'
    mockChangeLanguage.mockClear()
  })

  it('shows the current language in the trigger button', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: 'common.language' })).toHaveTextContent('common.english')
  })

  it('opens the language menu and marks the selected language', async () => {
    mockLanguage = 'es'

    render(<LanguageSwitcher />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'common.language' }))

    expect(screen.getByRole('menuitem', { name: 'common.english' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'common.spanish' })).toHaveClass('Mui-selected')
  })

  it('changes the language when selecting a menu option', async () => {
    render(<LanguageSwitcher />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'common.language' }))
    await user.click(screen.getByRole('menuitem', { name: 'common.spanish' }))

    expect(mockChangeLanguage).toHaveBeenCalledWith('es')
    expect(screen.getByRole('button', { name: 'common.language' })).toHaveTextContent('common.spanish')
    expect(screen.queryByRole('menuitem', { name: 'common.english' })).not.toBeInTheDocument()
  })
})
