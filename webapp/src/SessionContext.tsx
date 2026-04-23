import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface SessionContextType {
  sessionId: string;
  username: string;
  isLoggedIn: boolean;
  createSession: (username: string) => void;
  destroySession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>(() => localStorage.getItem('sessionId') || '');
  const [username, setUsername] = useState<string>(() => localStorage.getItem('username') || '');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('sessionId') && localStorage.getItem('username'));
  });

  // Retrieves data from localstorage on startup
  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedUsername = localStorage.getItem('username');

    if (storedSessionId && storedUsername) {
      setSessionId(storedSessionId);
      setUsername(storedUsername);
      setIsLoggedIn(true);
    }
  }, []);

  const createSession = (user: string): void => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setUsername(user);
    setIsLoggedIn(true);

    localStorage.setItem('sessionId', newSessionId);
    localStorage.setItem('username', user);
  };

  const destroySession = (): void => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    setSessionId('');
    setUsername('');
    setIsLoggedIn(false);
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
