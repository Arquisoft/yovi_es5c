import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateThemeColors } from '../utils/themeController';

describe('themeController', () => {
  beforeEach(() => {
    // Espiamos la función setProperty del root para ver si se llama con los valores correctos
    vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(() => {});
  });

  it('no debería llamar a setProperty si no se pasan parámetros', () => {
    updateThemeColors({});
    expect(document.documentElement.style.setProperty).not.toHaveBeenCalled();
  });

  it('debería actualizar los colores principales de la UI si se proporcionan', () => {
    updateThemeColors({
      accentColor: '#ff0000',
      buttonBg: '#00ff00',
      cardBg: 'rgba(0,0,0,0.5)',
    } as any); // Usamos 'any' si buttonBg no está en la interfaz pero se asume

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--yovi-ui-accent-color', '#ff0000');
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--yovi-ui-card-bg', 'rgba(0,0,0,0.5)');
  });

  it('debería actualizar los colores del tablero hexagonal correctamente', () => {
    updateThemeColors({
      boardHexEmptyColor: '#111111',
      boardHexPlayerBColor: '#222222',
      boardHexPlayerRColor: '#333333',
      boardHexBorderColor: '#444444'
    });

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--yovi-board-hex-default', '#111111');
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--yovi-board-hex-playerB', '#222222');
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--yovi-board-hex-playerR', '#333333');
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--yovi-board-border', '#444444');
  });
});