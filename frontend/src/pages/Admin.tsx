
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AuthModal from '@/components/AuthModal';

const Admin = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and is admin
    const user = localStorage.getItem('currentUser');
    console.log('Admin page - checking user:', user);
    
    if (user) {
      const userData = JSON.parse(user);
      console.log('Admin page - user data:', userData);
      setCurrentUser(userData);
      setIsLoggedIn(true);
      
      if (userData.role !== 'admin') {
        console.log('User is not admin, redirecting to home');
        navigate('/');
        return;
      }
    } else {
      console.log('No user found, opening auth modal');
      setIsAuthOpen(true);
    }
    
    setIsLoading(false);
  }, [navigate]);

  const handleLoginSuccess = (user) => {
    console.log('Login success in admin page:', user);
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setIsAuthOpen(false);
    
    if (user.role !== 'admin') {
      navigate('/');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  // Show auth modal if not logged in
  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-4">Please log in with admin credentials to access this area.</p>
          <AuthModal 
            isOpen={isAuthOpen}
            onClose={() => navigate('/')}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      </div>
    );
  }

  // Show admin dashboard if logged in as admin
  console.log('Rendering AdminDashboard with user:', currentUser);
  return <AdminDashboard currentUser={currentUser} />;
};

export default Admin;
