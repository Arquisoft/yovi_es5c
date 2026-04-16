import { vi } from 'vitest';

import '@testing-library/jest-dom'

const t = (key: string) => key

globalThis.IS_REACT_ACT_ENVIRONMENT = true

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',       
      resolvedLanguage: 'en',  
    },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))
