// hooks/useSaveUser.js
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSaveUser = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const saveUserToDatabase = async () => {
      if (!isLoaded || !isSignedIn || !user) return;

      console.log('Saving user to database...', user);

      try {
        const userData = {
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.imageUrl
        };

        const response = await fetch(`${API_URL}/api/clerk/save-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        });

        const data = await response.json();
        
        if (data.success) {
          console.log('✅ User saved to database:', data.data);
        } else {
          console.error('❌ Failed to save user:', data.error);
        }
      } catch (error) {
        console.error('❌ Error saving user:', error);
      }
    };

    saveUserToDatabase();
  }, [isLoaded, isSignedIn, user]);
};