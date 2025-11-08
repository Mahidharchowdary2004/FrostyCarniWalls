import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, AlertCircle, Truck } from 'lucide-react';
import Navigation from './Navigation';
import Cart from './Cart';
import OrderModal from './OrderModal';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface Order {
  _id: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  totalPrice: number;
  status: string;
  customerInfo: {
    userName: string;
    phone: string;
    address: string;
    paymentMethod: 'card' | 'cash';
  };
  createdAt: string;
}

const Orders = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  // Use React Query for orders data
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['orders', currentUser?._id],
    queryFn: async () => {
      if (!currentUser) {
        throw new Error('User not found');
      }
      if (!currentUser._id) {
        throw new Error('User ID not found');
      }
      return api.getUserOrders(currentUser._id);
    },
    enabled: !!currentUser?._id,
    staleTime: 10000, // Consider data fresh for 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      toast({
        title: "Authentication Required",
        description: "Please log in to view your orders.",
        variant: "destructive"
      });
    }
  }, [currentUser, navigate, toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'preparing':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter(item => item._id !== productId));
    } else {
      setCartItems(cartItems.map(item => 
        item._id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsOrderModalOpen(true);
  };

  const handleOrderSuccess = () => {
    setIsOrderModalOpen(false);
    refetch(); // Refresh orders after successful order
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleAuthClick = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          cartItemsCount={cartItems.length}
          onCartClick={handleCartClick}
          onAuthClick={handleAuthClick}
          isLoggedIn={!!currentUser}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Loading your orders...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          cartItemsCount={cartItems.length}
          onCartClick={handleCartClick}
          onAuthClick={handleAuthClick}
          isLoggedIn={!!currentUser}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Orders</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        cartItemsCount={cartItems.length}
        onCartClick={handleCartClick}
        onAuthClick={handleAuthClick}
        isLoggedIn={!!currentUser}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
          <p className="text-gray-600">Track the status of your orders</p>
        </div>

        {orders.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-orange-100 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center text-gray-600">
                <p className="mb-4">You haven't placed any orders yet.</p>
                <Button onClick={() => navigate('/')} variant="outline">
                  Browse Products
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order._id} className="bg-white/80 backdrop-blur-sm border-orange-100 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Order #{order._id.slice(-6)}</h2>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} px-3 py-1 rounded-full`}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status.replace(/_/g, ' ')}</span>
                      </div>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Order Items</h3>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-gray-600">
                            <span>{item.quantity}x {item.name}</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-orange-100 pt-2 mt-2">
                          <div className="flex justify-between items-center font-semibold text-orange-600">
                            <span>Total</span>
                            <span>₹{order.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Delivery Information</h3>
                      <div className="space-y-2 text-gray-600">
                        <p><span className="font-medium">Name:</span> {order.customerInfo.userName}</p>
                        <p><span className="font-medium">Phone:</span> {order.customerInfo.phone}</p>
                        <p><span className="font-medium">Address:</span> {order.customerInfo.address}</p>
                        <p><span className="font-medium">Payment Method:</span> {order.customerInfo.paymentMethod}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart Modal */}
      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        totalPrice={getTotalPrice()}
        isLoggedIn={true}
        onLoginRequired={() => {}}
        onCheckout={handleCheckout}
      />

      {/* Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        cartItems={cartItems}
        totalPrice={getTotalPrice()}
        currentUser={currentUser}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
};

export default Orders; 