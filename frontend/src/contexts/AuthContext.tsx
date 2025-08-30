import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types';
import apiService from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to get current user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user: loggedInUser, token } = await apiService.login({ email, password });
      setUser(loggedInUser);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
    } catch (error: any) {
      console.error('Login failed:', error);
      // Handle specific error messages
      if (error.response?.status === 403) {
        throw new Error(error.response?.data?.message || 'Your account is pending admin approval. Please wait for verification before logging in.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Invalid email or password. Please check your credentials and try again.');
      } else {
        throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
      }
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      await apiService.register(userData);
      // Do not set user or store token after registration
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 