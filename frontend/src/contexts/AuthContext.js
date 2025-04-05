'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after the component mounts on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only check authentication on the client side
    if (mounted) {
      const checkAuth = async () => {
        try {
          console.log('AuthContext: Checking authentication status');
          const result = await authService.verifyToken();
          console.log('AuthContext: Token verification result:', result);
          
          if (result.success) {
            console.log('AuthContext: User is authenticated');
            setUser(result.user);
            setIsAuthenticated(true);
          } else {
            console.log('AuthContext: Authentication failed:', result.message);
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error('AuthContext: Authentication check error:', error);
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }
  }, [mounted]);

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login');
      const result = await authService.login(email, password);
      console.log('AuthContext: Login result:', result);
      
      if (result.success) {
        console.log('AuthContext: Login successful');
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true, user: result.user };
      } else {
        console.log('AuthContext: Login failed:', result.error);
        return { 
          success: false, 
          error: result.error || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Attempting logout');
      await authService.logout();
      console.log('AuthContext: Logout successful');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Don't render children until the component is mounted on the client
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      loading, 
      user,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 