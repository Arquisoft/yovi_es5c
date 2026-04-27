import { useTranslation } from 'react-i18next'

export default function PageFooter() {
  const { t } = useTranslation()

  return (
    <footer
      style={{
        height: 'clamp(20px, 5vh, 72px)',
        padding: '0px 16px',
        borderTop: '1px solid #dddddd',
        background: 'rgba(15, 15, 39, 0.75)',
        marginTop: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        color: '#ffffff',
      }}
    >
      <small>{t('footer.copyright')}</small>
      <small>|</small>
      <small>
        <a
          href="https://github.com/Arquisoft/yovi_es5c"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#ffffff' }}
        >
          GitHub
        </a>
      </small>
      <small aria-hidden="true">|</small>
      <small>
        <a
          href="https://x.com/YGame_uniovi"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#ffffff' }}
        >
          Ranking diario en X
        </a>
      </small>
    </footer>
  )
}