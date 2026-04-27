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
        color: '#ffffff',
      }}
    >
      <small>{t('footer.copyright')}</small>
    </footer>
  )
}