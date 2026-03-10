// components/UserProfile.jsx
import { useUser } from '../contexts/UserContext';
import { useAuth } from '@clerk/clerk-react';

const UserProfile = () => {
  const { userData, loading, error, isSignedIn } = useUser();
  const { user } = useAuth();

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Welcome, {userData?.name || user?.fullName || 'User'}!</h2>
      <p>Email: {userData?.email || user?.primaryEmailAddress?.emailAddress}</p>
      <p>Clerk ID: {userData?.clerk_id}</p>
      {userData?.profile_image && (
        <img 
          src={userData.profile_image} 
          alt="Profile" 
          style={{ width: '100px', borderRadius: '50%' }}
        />
      )}
    </div>
  );
};

export default UserProfile;