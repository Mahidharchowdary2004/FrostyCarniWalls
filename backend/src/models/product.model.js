const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0, // Minimum price in INR
    validate: {
      validator: function(value) {
        return value >= 0 && Number.isFinite(value);
      },
      message: 'Price must be a valid positive number in Indian Rupees (INR)'
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['ice-cream', 'pizza', 'burger', 'drinks', 'chicken']
  },
  image: {
    type: String,
    required: true
  },
  pieces: {
    type: Number,
    required: function() {
      return this.category === 'chicken';
    },
    min: 1,
    default: null
  },
  orderTypes: {
    type: [String],
    enum: ['delivery', 'takeaway', 'dinein'],
    default: ['delivery', 'takeaway', 'dinein']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = { Product };