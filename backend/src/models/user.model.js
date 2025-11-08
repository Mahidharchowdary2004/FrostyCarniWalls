const mongoose = require('mongoose');

// Mongoose schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    address: { type: String },
    phone: { type: String, unique: true, sparse: true }, // Add phone field with unique constraint
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' }
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const UserModel = mongoose.model('User', userSchema);

module.exports = { UserModel };