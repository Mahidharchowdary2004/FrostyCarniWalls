import { useState, useEffect } from 'react';
import { X, CreditCard, MapPin, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import PaymentGateway from './PaymentGateway';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CustomerInfo {
  address: string;
  phone: string;
  notes: string;
  paymentMethod: string;
  deliveryOption: 'delivery' | 'takeaway' | 'dinein';
  userId?: string;
  userName?: string;
  userEmail?: string;
}

interface PaymentDetails {
  transactionId: string;
  amount: number;
  timestamp: string;
}

interface Order {
  items: OrderItem[];
  totalPrice: number;
  customerInfo: CustomerInfo;
  status: string;
  paymentStatus?: string;
  paymentDetails?: PaymentDetails;
}

const OrderModal = ({ isOpen, onClose, cartItems, totalPrice, currentUser, onOrderSuccess }) => {
  const [orderData, setOrderData] = useState({
    address: currentUser?.address || '',
    phone: currentUser?.phone || '',
    notes: '',
    paymentMethod: 'card',
    deliveryOption: 'delivery'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const { toast } = useToast();

  // Update orderData when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setOrderData(prev => ({
        ...prev,
        address: currentUser.address || '',
        phone: currentUser.phone || ''
      }));
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const createOrderObject = (): Order => {
    console.log('Creating order object with currentUser:', currentUser);
    
    if (!currentUser?._id && !currentUser?.id) {
      throw new Error('User ID is required');
    }
    
    // Format cart items to match the required schema
    const formattedItems = cartItems.map(item => ({
      id: item._id || item.id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: item.image
    }));

    const order: Order = {
      items: formattedItems,
      totalPrice: Number(totalPrice),
      customerInfo: {
        address: orderData.address.trim(),
        phone: orderData.phone.trim(),
        notes: orderData.notes?.trim() || '',
        paymentMethod: orderData.paymentMethod,
        deliveryOption: orderData.deliveryOption as 'delivery' | 'takeaway' | 'dinein',
        userId: (currentUser._id || currentUser.id).toString(),
        userName: currentUser.name || 'Guest',
        userEmail: currentUser.email
      },
      status: 'pending'
    };

    console.log('Created order object:', order);
    return order;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError(null);
    
    // Validate user
    if (!currentUser?._id && !currentUser?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to place an order.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate required fields based on delivery option
    if (orderData.deliveryOption === 'delivery' && !orderData.address.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a delivery address.",
        variant: "destructive"
      });
      return;
    }

    if (!orderData.phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your phone number.",
        variant: "destructive"
      });
      return;
    }

    try {
      const order = createOrderObject();
      console.log('Submitting order:', order);

      // Validate order data
      if (!order.customerInfo.userId) {
        throw new Error('User ID is required');
      }

      // If payment method is card, show payment gateway
      if (orderData.paymentMethod === 'card') {
        setShowPaymentGateway(true);
        return;
      }

      setIsProcessing(true);
      // For cash on delivery, save order directly
      const savedOrder = await api.createOrder(order);
      console.log('Order saved successfully:', savedOrder);
      
      toast({
        title: "Order Placed Successfully!",
        description: `Your order of ${formatPrice(totalPrice)} has been placed. ${
          orderData.deliveryOption === 'delivery' 
            ? 'Please have cash ready for delivery.' 
            : orderData.deliveryOption === 'takeaway'
            ? 'Please collect your order from the counter.'
            : 'Please wait at your table.'
        }`,
      });
      
      // Reset form and close modal
      setOrderData({ 
        address: '', 
        phone: '', 
        notes: '', 
        paymentMethod: 'card',
        deliveryOption: 'delivery'
      });
      onClose();
      onOrderSuccess(savedOrder);
    } catch (error) {
      console.error('Order submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process your order';
      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentDetails: PaymentDetails) => {
    setIsProcessing(true);
    try {
      const order: Order = createOrderObject();
      
      // Add payment details
      order.status = 'confirmed';
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        transactionId: paymentDetails.transactionId,
        amount: Number(paymentDetails.amount),
        timestamp: paymentDetails.timestamp
      };

      // Save order to database
      const savedOrder = await api.createOrder(order);
      console.log('Order saved with payment:', savedOrder);

      toast({
        title: "Payment Successful!",
        description: `Your order of ${formatPrice(totalPrice)} has been placed and paid.`,
      });

      // Reset form and close modals
      setOrderData({ address: '', phone: '', notes: '', paymentMethod: 'card', deliveryOption: 'delivery' });
      setShowPaymentGateway(false);
      onClose();
      onOrderSuccess(savedOrder);
    } catch (error) {
      console.error('Error saving order after payment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save your order';
      toast({
        title: "Error Saving Order",
        description: errorMessage,
        variant: "destructive"
      });
      setShowPaymentGateway(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setOrderData({ ...orderData, paymentMethod: method });
    setPaymentError(null); // Clear any previous payment errors
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <Card className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardTitle className="flex items-center justify-between">
              <span>Complete Your Order</span>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            {paymentError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Payment Error</h4>
                  <p className="text-sm text-red-600">{paymentError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Summary */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 font-semibold flex justify-between">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Delivery Option
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      orderData.deliveryOption === 'delivery' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => setOrderData({...orderData, deliveryOption: 'delivery'})}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="delivery"
                        checked={orderData.deliveryOption === 'delivery'}
                        onChange={() => setOrderData({...orderData, deliveryOption: 'delivery'})}
                      />
                      <span>🚚</span>
                      <span>Delivery</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      orderData.deliveryOption === 'takeaway' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => setOrderData({...orderData, deliveryOption: 'takeaway'})}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="takeaway"
                        checked={orderData.deliveryOption === 'takeaway'}
                        onChange={() => setOrderData({...orderData, deliveryOption: 'takeaway'})}
                      />
                      <span>🛍️</span>
                      <span>Takeaway</span>
                    </div>
                  </div>

                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      orderData.deliveryOption === 'dinein' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => setOrderData({...orderData, deliveryOption: 'dinein'})}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="dinein"
                        checked={orderData.deliveryOption === 'dinein'}
                        onChange={() => setOrderData({...orderData, deliveryOption: 'dinein'})}
                      />
                      <span>🍽️</span>
                      <span>Dine-in</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info - Only show address for delivery */}
              {orderData.deliveryOption === 'delivery' && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Delivery Information
                  </h3>
                  
                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your full delivery address"
                      value={orderData.address}
                      onChange={(e) => setOrderData({...orderData, address: e.target.value})}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Your phone number"
                  value={orderData.phone}
                  onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Special Instructions</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions for your order"
                  value={orderData.notes}
                  onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                  className="mt-1"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Method
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      orderData.paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => handlePaymentMethodChange('card')}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={orderData.paymentMethod === 'card'}
                        onChange={() => handlePaymentMethodChange('card')}
                      />
                      <CreditCard className="h-4 w-4" />
                      <span>Credit/Debit Card</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      orderData.paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => handlePaymentMethodChange('cash')}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={orderData.paymentMethod === 'cash'}
                        onChange={() => handlePaymentMethodChange('cash')}
                      />
                      <span>💰</span>
                      <span>Cash on Delivery</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimated Delivery */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <Clock className="h-4 w-4" />
                <span>Estimated delivery time: 30-45 minutes</span>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing Order...' : `Place Order - ${formatPrice(totalPrice)}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentGateway && (
        <PaymentGateway
          isOpen={showPaymentGateway}
          onClose={() => setShowPaymentGateway(false)}
          amount={totalPrice}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default OrderModal;
