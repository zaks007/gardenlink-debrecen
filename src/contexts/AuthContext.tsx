import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, getStoredUser, getToken, type User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        // Try to get current user from API
        try {
          const response = await authApi.getCurrentUser();
          if (response) {
            setUser(response.user);
          } else {
            // Token invalid, try stored user as fallback
            const storedUser = getStoredUser();
            if (storedUser) {
              setUser(storedUser);
            }
          }
        } catch {
          // API unreachable, use stored user
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signOut = () => {
    authApi.logout();
    setUser(null);
    navigate('/auth');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
