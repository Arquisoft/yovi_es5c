import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { SessionProvider, useSession } from '../SessionContext'; // Ajusta la ruta si es necesario

// Un componente de prueba (Dummy) para consumir el contexto y simular interacciones
const TestComponent = () => {
  const { sessionId, username, isLoggedIn, createSession, destroySession } = useSession();

  return (
    <div>
      <span data-testid="sessionId">{sessionId}</span>
      <span data-testid="username">{username}</span>
      <span data-testid="isLoggedIn">{isLoggedIn.toString()}</span>
      <button onClick={() => createSession('testuser', 'fake-token-123')}>
        Login
      </button>
      <button onClick={() => destroySession()}>
        Logout
      </button>
    </div>
  );
};

describe('SessionContext', () => {
  beforeEach(() => {
    let store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => key in store ? store[key] : null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };

    vi.stubGlobal('localStorage', mockLocalStorage);

    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('inicia con la sesión vacía si no hay datos en localStorage', () => {
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('false');
    expect(screen.getByTestId('sessionId')).toBeEmptyDOMElement();
    expect(screen.getByTestId('username')).toBeEmptyDOMElement();
    
    // No se debería hacer ninguna petición fetch
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('restaura la sesión desde localStorage si el token es válido', async () => {
    // Simulamos datos existentes en localStorage
    localStorage.setItem('sessionId', 'valid-token');
    localStorage.setItem('username', 'existinguser');

    // Simulamos que el fetch de validación es exitoso
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
    });

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    // Verificamos que se llame al endpoint correcto con el token
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/user/existinguser', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
    });

    // Verificamos que la sesión se marca como activa
    await waitFor(() => {
      expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('true');
      expect(screen.getByTestId('username')).toHaveTextContent('existinguser');
      expect(screen.getByTestId('sessionId')).toHaveTextContent('valid-token');
    });
  });

  it('destruye la sesión si la validación falla (respuesta no ok)', async () => {
    localStorage.setItem('sessionId', 'expired-token');
    localStorage.setItem('username', 'olduser');

    // Simulamos que el servidor rechaza el token (ej. 401 Unauthorized)
    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    // Esperamos que se complete la validación fallida y se destruya la sesión
    await waitFor(() => {
      expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('false');
    });

    // Verificamos que se haya limpiado el localStorage
    expect(localStorage.getItem('sessionId')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
  });

  it('destruye la sesión si hay un error de red al validar (bloque catch)', async () => {
    localStorage.setItem('sessionId', 'error-token');
    localStorage.setItem('username', 'erroruser');

    // Simulamos un fallo de red
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));
    
    // Ocultamos el console.error esperado en los tests para no ensuciar la terminal
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('false');
    });

    expect(localStorage.getItem('sessionId')).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Error al validar la sesión:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('permite crear una sesión (createSession)', async () => {
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );
    const user = userEvent.setup();

    // Hacemos click en el botón que dispara createSession
    await user.click(screen.getByText('Login'));

    // Verifica los estados
    expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('true');
    expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    expect(screen.getByTestId('sessionId')).toHaveTextContent('fake-token-123');

    // Verifica que se guardó en localStorage
    expect(localStorage.getItem('sessionId')).toBe('fake-token-123');
    expect(localStorage.getItem('username')).toBe('testuser');
  });

  it('permite destruir una sesión (destroySession)', async () => {
    // Forzamos que haya una sesión activa desde el inicio
    localStorage.setItem('sessionId', 'token-to-delete');
    localStorage.setItem('username', 'user-to-delete');
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );
    const user = userEvent.setup();

    // Esperamos a que la sesión esté cargada
    await waitFor(() => expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('true'));

    // Hacemos click en el botón que dispara destroySession
    await user.click(screen.getByText('Logout'));

    // Verifica que el estado y el localStorage se limpian
    expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toBeEmptyDOMElement();
    expect(localStorage.getItem('sessionId')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
  });

  it('lanza un error si se usa useSession fuera del SessionProvider', () => {
    // Ocultamos el error de React en consola para tener un output limpio
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Intentar renderizar el dummy test SIN el <SessionProvider> alrededor
    expect(() => render(<TestComponent />)).toThrow('useSession must be used inside a SessionProvider');

    consoleSpy.mockRestore();
  });
});