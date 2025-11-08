const validateOrder = (req, res, next) => {
  const { items, totalPrice, customerInfo } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  if (!totalPrice || typeof totalPrice !== 'number' || totalPrice <= 0) {
    return res.status(400).json({ message: 'Invalid total price' });
  }

  if (!customerInfo) {
    return res.status(400).json({ message: 'Customer information is missing' });
  }

  if (!customerInfo.phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  // Only require address for delivery orders
  if (customerInfo.deliveryOption === 'delivery' && !customerInfo.address) {
    return res.status(400).json({ message: 'Delivery address is required for delivery orders' });
  }

  next();
};

module.exports = { validateOrder };