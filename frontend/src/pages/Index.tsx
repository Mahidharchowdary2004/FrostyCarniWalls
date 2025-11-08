import { useState, useEffect } from 'react';
import { ShoppingCart, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import ProductGrid from '@/components/ProductGrid';
import Cart from '@/components/Cart';
import AuthModal from '@/components/AuthModal';
import OrderModal from '@/components/OrderModal';
import MenuView from '@/components/MenuView';
import PaymentGateway from '@/components/PaymentGateway';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isMenuViewOpen, setIsMenuViewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { toast } = useToast();

  // Load user data from localStorage on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setIsLoggedIn(true);
      setCurrentUser(userData);
    }
  }, []);

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item._id === product._id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter(item => item._id !== productId));
    } else {
      setCartItems(cartItems.map(item => 
        item._id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCartItems([]);
    toast({ title: "Logged out successfully!" });
  };

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setIsAuthOpen(false);
    toast({ 
      title: "Welcome back!", 
      description: `Hello, ${user.name}!` 
    });
  };

  const handleOrderNow = () => {
    if (!isLoggedIn) {
      setIsAuthOpen(true);
      return;
    }
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add some items to your cart first.",
        variant: "destructive"
      });
      return;
    }
    setIsOrderModalOpen(true);
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      setIsCartOpen(false);
      setIsAuthOpen(true);
      return;
    }
    setIsCartOpen(false);
    setIsPaymentOpen(true);
  };

  const handleOrderSuccess = (order) => {
    if (order.customerInfo.paymentMethod === 'card') {
      // Open payment gateway for card payments
      setIsPaymentOpen(true);
    } else {
      // For cash on delivery, just clear the cart
      setCartItems([]);
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been placed. Please have cash ready for delivery.",
      });
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    // Clear cart after successful payment
    setCartItems([]);
    setIsPaymentOpen(false);
    
    toast({
      title: "Payment Successful!",
      description: `Your order has been confirmed. Transaction ID: ${paymentData.transactionId}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Navigation 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        cartItemsCount={getTotalItems()}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Hero Section - Hide for admin */}
      {currentUser?.role !== 'admin' && (
        <section className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 bg-clip-text text-transparent mb-6 animate-fade-in">
              Delicious Treats Delivered
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-fade-in">
              Fresh ice cream, crispy pizzas, and juicy burgers - all made with love and delivered to your door
            </p>
            <div className="flex gap-4 justify-center animate-scale-in">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3"
                onClick={handleOrderNow}
              >
                Order Now
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-3"
                onClick={() => setIsMenuViewOpen(true)}
              >
                View Menu
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Products Section - Hide for admin */}
      {currentUser?.role !== 'admin' && (
        <ProductGrid 
          selectedCategory={selectedCategory}
          onAddToCart={addToCart}
          isLoggedIn={isLoggedIn}
          onLoginRequired={() => setIsAuthOpen(true)}
        />
      )}

      {/* Cart Modal */}
      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        totalPrice={getTotalPrice()}
        isLoggedIn={isLoggedIn}
        onLoginRequired={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
        onCheckout={handleCheckout}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
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

      {/* Menu View Modal */}
      <MenuView
        isOpen={isMenuViewOpen}
        onClose={() => setIsMenuViewOpen(false)}
        onAddToCart={addToCart}
        isLoggedIn={isLoggedIn}
        onLoginRequired={() => {
          setIsMenuViewOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* Payment Gateway */}
      <PaymentGateway
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        amount={getTotalPrice()}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Index;
