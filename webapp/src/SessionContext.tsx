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

  const createSession = (username: string, token: string): void => {
    setSessionId(token);
    setUsername(username);
    setIsLoggedIn(true);

    localStorage.setItem('sessionId', token);
    localStorage.setItem('username', username);
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