import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';

interface SessionContextType {
  sessionId: string;
  username: string;
  isLoggedIn: boolean;
  createSession: (username: string, token: string) => void;
  destroySession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [_, setIsReady] = useState<boolean>(false); // Nuevo estado para saber si ya validamos

  const destroySession = (): void => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    setSessionId('');
    setUsername('');
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const validateSession = async () => {
      const storedSessionId = localStorage.getItem('sessionId');
      const storedUsername = localStorage.getItem('username');

      if (storedSessionId && storedUsername) {
        try {
          // Validamos el token intentando obtener el perfil del usuario
          const response = await fetch(`http://localhost:8000/user/${storedUsername}`, {
            headers: {
              'Authorization': `Bearer ${storedSessionId}`
            }
          });

          if (response.ok) {
            setSessionId(storedSessionId);
            setUsername(storedUsername);
            setIsLoggedIn(true);
          } else {
            // El token es falso o expiró: destruimos la sesión
            destroySession();
          }
        } catch (error) {
          console.error('Error al validar la sesión:', error);
          destroySession();
        }
      }
      setIsReady(true); // Validación completada
    };

    validateSession();
  }, []);

  const createSession = (username: string, token: string): void => {
    setSessionId(token);
    setUsername(username);
    setIsLoggedIn(true);

    localStorage.setItem('sessionId', token);
    localStorage.setItem('username', username);
  };

  return (
    <SessionContext.Provider value={{ sessionId, username, isLoggedIn, createSession, destroySession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used inside a SessionProvider');
  }
  return context;
};

export { SessionContext, SessionProvider };