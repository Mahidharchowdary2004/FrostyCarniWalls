const { UserModel } = require('../models/user.model');

// Function to create default admin account
const createDefaultAdmin = async () => {
  try {
    const adminExists = await UserModel.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      await UserModel.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin@123', // More secure default password
        role: 'admin',
        address: 'Admin Address',
        theme: 'light'
      });
      console.log('Default admin account created successfully');
    } else {
      console.log('Default admin account already exists');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Call this function when the server starts
createDefaultAdmin();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    // Validate input
    if (!email || !password) {
      console.log('Missing credentials:', { email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    console.log('User found:', !!user);

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        details: 'No user found with this email'
      });
    }

    // Compare passwords
    const isPasswordValid = user.password === password;
    console.log('Password validation:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        details: 'Password is incorrect'
      });
    }

    // Return user data (excluding password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      phone: user.phone,
      theme: user.theme
    };

    console.log('Login successful for:', email);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message || 'Unknown error'
    });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;

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
    const user = await UserModel.create({
      name,
      email,
      password,
      address,
      phone, // Add phone field
      role: 'user',
      theme: 'light'
    });

    // Return user data (excluding password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      phone: user.phone,
      theme: user.theme
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userData
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
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = { login, register };