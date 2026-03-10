// contexts/UserContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { getToken, isSignedIn, userId } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn || !userId) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isSignedIn, userId, getToken]);

  const value = {
    userData,
    loading,
    error,
    isSignedIn
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};