import { useState } from 'react';
import { ShoppingCart, User, LogIn, LogOut, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const Navigation = ({ 
  selectedCategory, 
  onCategoryChange, 
  cartItemsCount, 
  onCartClick, 
  onAuthClick,
  isLoggedIn,
  currentUser,
  onLogout
}) => {
  const navigate = useNavigate();
  
  const categories = [
    { id: 'all', name: 'All Items', emoji: '🍽️' },
    { id: 'ice-cream', name: 'Ice Cream', emoji: '🍦' },
    { id: 'pizza', name: 'Pizza', emoji: '🍕' },
    { id: 'burger', name: 'Burgers', emoji: '🍔' },
    { id: 'chicken', name: 'Chicken', emoji: '🍗' },
  ];

  const isAdmin = currentUser?.role === 'admin';

  const handleAdminPanelClick = () => {
    navigate('/admin');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleOrdersClick = () => {
    navigate('/orders');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleLogoClick}>
            <img 
              src="/logo.png" 
              alt="TastyBites Logo" 
              className="h-20 w-auto"
            />
            {isAdmin && (
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>

          {/* Category Pills - Hide for admin */}
          {!isAdmin && (
            <div className="hidden md:flex items-center space-x-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onCategoryChange(category.id)}
                  className={`${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                      : "hover:bg-orange-50"
                  } transition-all duration-200`}
                >
                  <span className="mr-1">{category.emoji}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Cart Button - Hide for admin */}
            {!isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCartClick}
                className="relative hover:bg-orange-50 border-orange-200"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Menu */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hover:bg-orange-50 border-orange-200">
                    <User className="h-4 w-4 mr-1" />
                    {currentUser?.name || 'User'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white">
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  {!isAdmin && (
                    <DropdownMenuItem onClick={handleOrdersClick}>
                      <Settings className="h-4 w-4 mr-2" />
                      Orders
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={handleAdminPanelClick}>
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Products
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onAuthClick}
                className="hover:bg-orange-50 border-orange-200"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
