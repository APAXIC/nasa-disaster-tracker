import { useEffect, useState } from 'react';
import { fetchCurrentUser, logoutUser } from './api.js';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      setUser(null);
      return;
    }

    try {
      const data = await fetchCurrentUser();

      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
        localStorage.removeItem('accessToken');
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('accessToken');
    }
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return { user, setUser, isAuthModalOpen, setIsAuthModalOpen,
    handleAuthSuccess, handleLogout };
}
