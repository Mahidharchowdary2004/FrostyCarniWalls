const express = require('express');
const { Order } = require('../models/order.model');
const { validateOrder } = require('../middleware/validation');

const router = express.Router();

// Get all orders (admin only)
router.get('/', async (req, res) => {
  try {
    console.log('=== Fetching All Orders ===');
    const orders = await Order.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();
    
    console.log(`Found ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get orders by phone number
router.get('/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    console.log('Fetching orders for phone:', phone);
    
    const orders = await Order.find({
      'customerInfo.phone': phone
    })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('Found orders:', orders);

    // Format the orders before sending with null checks
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      items: (order.items || []).map(item => ({
        id: item.id || item._id,
        name: item.name || 'Unknown Item',
        price: item.price || 0,
        quantity: item.quantity || 0,
        image: item.image || ''
      })),
      totalPrice: order.totalPrice || 0,
      status: order.status || 'pending',
      customerInfo: {
        userName: order.customerInfo?.userName || 'Guest',
        phone: order.customerInfo?.phone || '',
        address: order.customerInfo?.address || '',
        paymentMethod: order.customerInfo?.paymentMethod || 'cash',
        deliveryOption: order.customerInfo?.deliveryOption || 'delivery'
      },
      createdAt: order.createdAt || new Date()
    }));

    console.log('Formatted orders:', formattedOrders);
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders by phone:', error);
    res.status(500).json({ 
      message: 'Error fetching orders', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    console.log('Fetching orders for user:', userId);
    
    const orders = await Order.find({
      $or: [
        { 'customerInfo.userId': userId },
        { 'customerInfo.userId': userId.toString() }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('Found orders:', orders);

    // Format the orders before sending with null checks
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      items: (order.items || []).map(item => ({
        id: item.id || item._id,
        name: item.name || 'Unknown Item',
        price: item.price || 0,
        quantity: item.quantity || 0,
        image: item.image || ''
      })),
      totalPrice: order.totalPrice || 0,
      status: order.status || 'pending',
      customerInfo: {
        userName: order.customerInfo?.userName || 'Guest',
        phone: order.customerInfo?.phone || '',
        address: order.customerInfo?.address || '',
        paymentMethod: order.customerInfo?.paymentMethod || 'cash',
        deliveryOption: order.customerInfo?.deliveryOption || 'delivery'
      },
      createdAt: order.createdAt || new Date()
    }));

    console.log('Formatted orders:', formattedOrders);
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      message: 'Error fetching user orders', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create new order
router.post('/', validateOrder, async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    console.log('New order created:', order._id);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`Order ${orderId} status updated to ${status}`);
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

// Cancel order
router.put('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending orders can be cancelled',
        currentStatus: order.status
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: 'cancelled' },
      { new: true }
    );

    console.log(`Order ${orderId} cancelled successfully`);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
});

module.exports = router;