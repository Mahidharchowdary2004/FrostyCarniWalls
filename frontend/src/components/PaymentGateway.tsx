import { useState } from 'react';
import { CreditCard, Lock, AlertCircle, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const PaymentGateway = ({ isOpen, onClose, amount, onPaymentSuccess }) => {
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError(null);
    setIsProcessing(true);

    try {
      // Test card validation
      if (cardData.number === '4242 4242 4242 4242') {
        // Success case
        await new Promise(resolve => setTimeout(resolve, 2000));
        onPaymentSuccess({
          transactionId: Math.random().toString(36).substring(7).toUpperCase(),
          amount,
          timestamp: new Date().toISOString()
        });
      } else if (cardData.number === '4000 0000 0000 0002') {
        // Declined card
        throw new Error('Card declined');
      } else if (cardData.number === '4000 0000 0000 9995') {
        // Insufficient funds
        throw new Error('Insufficient funds');
      } else {
        // Random failure for other cards
        if (Math.random() < 0.3) {
          throw new Error('Payment failed');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        onPaymentSuccess({
          transactionId: Math.random().toString(36).substring(7).toUpperCase(),
          amount,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      let errorMessage = 'Your payment could not be processed. Please check your card details and try again.';
      
      if (error.message === 'Card declined') {
        errorMessage = 'This card has been declined. Please use a different card.';
      } else if (error.message === 'Insufficient funds') {
        errorMessage = 'This card has insufficient funds. Please use a different card.';
      }
      
      setPaymentError(errorMessage);
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
    setPaymentError(null); // Clear error when user makes changes
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <Card className="relative w-full max-w-md mx-4 bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center justify-between">
            <span>Payment Details</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Test Card Information */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Test Card Information</h4>
                <ul className="text-sm text-blue-600 space-y-1 mt-1">
                  <li>• Success: 4242 4242 4242 4242</li>
                  <li>• Declined: 4000 0000 0000 0002</li>
                  <li>• Insufficient Funds: 4000 0000 0000 9995</li>
                  <li>• Any other card: Random success/failure</li>
                </ul>
                <p className="text-xs text-blue-500 mt-2">Use any future expiry date and any 3-digit CVC</p>
              </div>
            </div>
          </div>

          {paymentError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Payment Error</h4>
                <p className="text-sm text-red-600">{paymentError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="number">Card Number</Label>
              <Input
                id="number"
                name="number"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardData.number}
                onChange={handleInputChange}
                required
                pattern="[0-9\s]{13,19}"
                maxLength={19}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="name">Cardholder Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={cardData.name}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  name="expiry"
                  type="text"
                  placeholder="MM/YY"
                  value={cardData.expiry}
                  onChange={handleInputChange}
                  required
                  pattern="(0[1-9]|1[0-2])\/([0-9]{2})"
                  maxLength={5}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  name="cvc"
                  type="text"
                  placeholder="123"
                  value={cardData.cvc}
                  onChange={handleInputChange}
                  required
                  pattern="[0-9]{3,4}"
                  maxLength={4}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center text-xs text-gray-600 mt-4">
              <Lock className="h-3 w-3 mr-1" />
              Your payment information is encrypted and secure
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₹{amount.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentGateway;
