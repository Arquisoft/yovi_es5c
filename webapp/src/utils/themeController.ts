export interface LoginThemeParams {
  accentColor?: string;
  buttonBg?: string;
  buttonText?: string;
  textPrimary?: string;
  textSecondary?: string;
  cardBg?: string;
}

/**
 * Función inactiva por defecto que permite cambiar los colores de las vistas.
 */
export const updateThemeColors = (themeParams: LoginThemeParams) => {
  const root = document.documentElement;

  if (themeParams.accentColor) {
    root.style.setProperty('--yovi-ui-accent-color', themeParams.accentColor);
  }
  if (themeParams.buttonBg) {
    root.style.setProperty('--yovi-ui-button-bg', themeParams.buttonBg);
  }
  if (themeParams.buttonText) {
    root.style.setProperty('--yovi-ui-button-text', themeParams.buttonText);
  }
  if (themeParams.textPrimary) {
    root.style.setProperty('--yovi-ui-text-primary', themeParams.textPrimary);
  }
  if (themeParams.textSecondary) {
    root.style.setProperty('--yovi-ui-text-secondary', themeParams.textSecondary);
  }
  if (themeParams.cardBg) {
    root.style.setProperty('--yovi-ui-card-bg', themeParams.cardBg);
  }
};