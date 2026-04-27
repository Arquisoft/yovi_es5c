import React, { createContext, useState, useEffect, useContext, useMemo, useCallback, type ReactNode } from 'react';

interface SessionContextType {
  sessionId: string;
  username: string;
  isLoggedIn: boolean;
  isReady: boolean;
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
  const [isReady, setIsReady] = useState<boolean>(false);

  const destroySession = useCallback((): void => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    setSessionId('');
    setUsername('');
    setIsLoggedIn(false);
  }, []);


  useEffect(() => {
    const validateSession = async () => {
      const storedSessionId = localStorage.getItem('sessionId');
      const storedUsername = localStorage.getItem('username');

      if (storedSessionId && storedUsername) {
        const usernameRegex = /^[a-zA-Z0-9_-]+$/; 
        
        if (!usernameRegex.test(storedUsername)) {
          console.error('Formato de usuario inválido en localStorage.');
          destroySession();
          setIsReady(true);
          return;
        }

        try {
          const safeUsername = encodeURIComponent(storedUsername);
          
          const response = await fetch(`http://localhost:8000/user/${safeUsername}`, {
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

  const createSession = useCallback((username: string, token: string): void => {
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    const tokenRegex = /^[a-zA-Z0-9-_.]+$/;

    if (!usernameRegex.test(username) || !tokenRegex.test(token)) {
      console.error('Intento de guardar datos inválidos o potencialmente maliciosos en la sesión.');
      return; 
    }

    setSessionId(token);
    setUsername(username);
    setIsLoggedIn(true);

    localStorage.setItem('sessionId', token);
    localStorage.setItem('username', username);
  }, []);

  const contextValue = useMemo(() => ({
    sessionId,
    username,
    isLoggedIn,
    isReady,
    createSession,
    destroySession,
  }), [sessionId, username, isLoggedIn, isReady, createSession, destroySession]);

  return (
    <SessionContext.Provider value={contextValue}>
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
