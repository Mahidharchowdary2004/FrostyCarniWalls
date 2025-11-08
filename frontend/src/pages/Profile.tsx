import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    } else {
      navigate('/');
    }
    setIsLoading(false);
  }, [navigate]);

  const handleUpdate = (updatedUser) => {
    // Update both state and localStorage
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Show success message
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleAuthClick = () => {
    navigate('/');
  };

  const handleCartClick = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          cartItemsCount={0}
          onCartClick={handleCartClick}
          onAuthClick={handleAuthClick}
          isLoggedIn={!!currentUser}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        cartItemsCount={0}
        onCartClick={handleCartClick}
        onAuthClick={handleAuthClick}
        isLoggedIn={true}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">My Profile</h1>
          <UserProfile 
            currentUser={currentUser} 
            onUpdate={handleUpdate}
            key={currentUser._id}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile; 