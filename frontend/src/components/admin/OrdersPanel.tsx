import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, AlertCircle, Truck, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');
  const { toast } = useToast();

  // Function to format price in Indian Rupees
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders...');
      const data = await api.getOrders();
      console.log('Orders data received:', data);
      
      if (!Array.isArray(data)) {
        console.error('Invalid orders data received:', data);
        throw new Error('Invalid orders data format');
      }
      
      // Sort orders based on the selected sort order
      const sortedOrders = [...data].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
      
      setOrders(sortedOrders);
      console.log('Orders state updated with', sortedOrders.length, 'orders');
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('OrdersPanel mounted');
    fetchOrders();
  }, [sortOrder]); // Refetch when sort order changes

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      console.log('Updating order status:', { orderId, newStatus });
      await api.updateOrderStatus(orderId, newStatus);
      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });
      await fetchOrders(); // Refresh orders after update
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status) => {
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

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'out_for_delivery',
      'out_for_delivery': 'delivered',
      'delivered': null,
      'cancelled': null
    };
    return statusFlow[currentStatus];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-orange-100 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center text-gray-600">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="flex justify-between items-center">
          <CardTitle>Orders Management</CardTitle>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[180px] bg-white text-gray-900">
                <SelectValue placeholder="Sort by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {orders.length === 0 ? (
          <div className="text-center text-gray-500">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-orange-100">
                  <th className="text-left py-3 px-4 text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 text-gray-600">Date & Time</th>
                  <th className="text-left py-3 px-4 text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-600">Items</th>
                  <th className="text-left py-3 px-4 text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-orange-100 hover:bg-orange-50/50">
                    <td className="py-3 px-4 font-medium">{order._id.slice(-6)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{order.customerInfo.userName || 'Guest'}</div>
                        <div className="text-sm text-gray-500">
                          <div>📱 {order.customerInfo.phone}</div>
                          {order.customerInfo.deliveryOption === 'delivery' && (
                            <div>📍 {order.customerInfo.address}</div>
                          )}
                          <div>💳 {order.customerInfo.paymentMethod}</div>
                          <div>
                            {order.customerInfo.deliveryOption === 'delivery' && '🚚 Delivery'}
                            {order.customerInfo.deliveryOption === 'takeaway' && '🛍️ Takeaway'}
                            {order.customerInfo.deliveryOption === 'dinein' && '🍽️ Dine-in'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-gray-700">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-orange-600">{formatPrice(order.totalPrice)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="capitalize text-gray-700">{order.status.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {getNextStatus(order.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(order._id, getNextStatus(order.status))}
                            className="hover:bg-orange-50"
                          >
                            Update Status
                          </Button>
                        )}
                        {order.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersPanel; 