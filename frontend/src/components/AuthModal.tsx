import { useState } from 'react';
import { X, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); // Add phone state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Clear messages when switching tabs or closing
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Default admin credentials
  const defaultAdmin = {
    email: 'mahidhar@gmail.com',
    password: 'Mahidhar@123',
    userData: {
      id: 2,
      name: 'Admin User',
      email: 'mahidhar@gmail.com',
      role: 'admin'
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    // Check if it's admin login
    if (email === defaultAdmin.email && password === defaultAdmin.password) {
      console.log('Admin login detected, redirecting to admin panel');
      onLoginSuccess(defaultAdmin.userData);
      // Redirect to admin panel after successful login
      setTimeout(() => {
        window.location.href = '/admin';
      }, 500);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await userApi.signIn({
        email,
        password
      });
      
      setSuccess('Login successful!');
      setTimeout(() => {
        onLoginSuccess(response.user);
        // Redirect based on user role
        if (response.user.role === 'admin') {
          window.location.href = '/admin';
        }
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDefaultLogin = (userType) => {
    if (userType === 'admin') {
      setEmail(defaultAdmin.email);
      setPassword(defaultAdmin.password);
      onLoginSuccess(defaultAdmin.userData);
    } else {
      // For regular users, use the API
      handleLogin({ preventDefault: () => {} });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await userApi.register({ name, email, password, phone }); // Include phone in registration
      setSuccess('Account created successfully! Logging you in...');
      setTimeout(() => {
        onLoginSuccess(response.user);
      }, 1000);
    } catch (error: any) {
      console.error('Registration error:', error);
      // Provide more detailed error messages
      if (error.message) {
        setError(error.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Auth Modal */}
      <Card className="relative w-full max-w-md mx-4 bg-white shadow-xl rounded-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <CardTitle className="flex items-center text-xl font-bold text-gray-900">
            <User className="h-5 w-5 mr-2 text-orange-500" />
            Account
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
          
          <Tabs defaultValue="login" className="w-full" onValueChange={clearMessages}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="login"
                className="data-[state=active]:bg-white data-[state=active]:text-orange-500 data-[state=active]:shadow-sm rounded-md"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-white data-[state=active]:text-orange-500 data-[state=active]:shadow-sm rounded-md"
              >
                Register
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Welcome Back!</h3>
                <p className="text-sm text-gray-600 mt-1">Sign in to your account</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create Account</h3>
                <p className="text-sm text-gray-600 mt-1">Join TastyBites today</p>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    placeholder="Create a password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                  <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <span className="mr-2">🔒</span>
              Secure authentication powered by Supabase
            </p>
            <p className="text-xs text-gray-400 mt-1">Connect Supabase for full functionality</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthModal;
