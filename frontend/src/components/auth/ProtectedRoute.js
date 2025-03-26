'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useStore from '@/store/useStore';
import { authService } from '@/services/auth';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { isAuthenticated, setUser } = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          // TODO: Add an API endpoint to get user data
          // const userData = await authService.getUserData();
          // setUser(userData);
        } catch (error) {
          authService.logout();
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, setUser]);

  if (!isAuthenticated) {
    return null; // Return null while redirecting
  }

  return children;
} 