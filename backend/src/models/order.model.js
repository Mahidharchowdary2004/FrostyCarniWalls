const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, required: true }
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  customerInfo: {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String },
    address: { type: String },
    phone: { type: String, required: true },
    notes: { type: String, default: '' },
    deliveryOption: {
      type: String,
      enum: ['delivery', 'takeaway', 'dinein'],
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash'],
      default: 'cash'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = { Order };