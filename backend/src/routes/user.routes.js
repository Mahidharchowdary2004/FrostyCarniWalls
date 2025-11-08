const { Router } = require('express');
const { UserModel } = require('../models/user.model');
const { userSchema } = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');
const mongoose = require('mongoose');

const router = Router();

// Format phone number to E.164 format
const formatPhoneNumber = (phone) => {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If number starts with 0, replace with 91 (India)
  if (digits.startsWith('0')) {
    return '+91' + digits.substring(1);
  }
  
  // If number doesn't start with +, add +91 (India)
  if (!phone.startsWith('+')) {
    return '+91' + digits;
  }
  
  return phone;
};

// Generate and send OTP
// Remove /send-otp and /verify-otp endpoints and all phone login logic

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const { _id, ...updateData } = req.body;
    
    // Validate user data
    // Note: Zod validation removed for simplicity, but you might want to add validation
    const user = await UserModel.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // In profile update response, remove phone from returned user object
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address || '',
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', async (req, res, next) => {
  try {
    console.log('=== Updating User ===');
    console.log('User ID:', req.params.id);
    console.log('Update data:', req.body);
    
    const { name, email, phone, role, address } = req.body;
    
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (address !== undefined) updateData.address = address;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('Updated user:', user);
    
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error.message || 'Unknown error');
    next(error);
  }
});

// User registration
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'user', phone } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      throw new AppError(400, 'Name, email, and password are required');
    }
    
    // Check if user already exists with email
    const existingUserByEmail = await UserModel.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Check if user already exists with phone (if phone is provided)
    if (phone) {
      const existingUserByPhone = await UserModel.findOne({ phone });
      if (existingUserByPhone) {
        return res.status(400).json({
          success: false,
          message: 'A user with this phone number already exists'
        });
      }
    }
    
    // Create new user
    const newUser = new UserModel({
      name,
      email,
      password,
      phone, // Add phone field
      role
    });
    const savedUser = await newUser.save();
    
    // Return user data (omit password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        address: savedUser.address || '',
        phone: savedUser.phone || '',
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A user with this ${field} already exists`
      });
    }
    
    next(error);
  }
});

// Email/password login
router.post('/signin', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }
    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }
    // Plain text password check (not secure)
    if (user.password !== password) {
      throw new AppError(401, 'Invalid email or password');
    }
    // Return user data (omit password)
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address || '',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get('/', async (req, res, next) => {
  try {
    console.log('=== Fetching All Users ===');
    const users = await UserModel.find();
    console.log('Found users:', users);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message || 'Unknown error');
    next(error);
  }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    console.log('=== Fetching User by ID ===');
    console.log('User ID:', req.params.id);
    const user = await UserModel.findById(req.params.id);
    console.log('Found user:', user);
    
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error.message || 'Unknown error');
    next(error);
  }
});

// Delete user
router.delete('/:id', async (req, res, next) => {
  try {
    console.log('=== Deleting User ===');
    console.log('User ID:', req.params.id);
    
    const user = await UserModel.findByIdAndDelete(req.params.id);
    console.log('Deleted user:', user);
    
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error.message || 'Unknown error');
    next(error);
  }
});

module.exports = { userRoutes: router };