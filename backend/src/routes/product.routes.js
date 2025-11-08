const express = require('express');
const multer = require('multer');
const { Product } = require('../models/product.model');
const mongoose = require('mongoose');

const router = express.Router();

// Configure multer for memory storage (base64 conversion)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Sample products data
const sampleProducts = [
  {
    name: 'Vanilla Ice Cream',
    description: 'Classic vanilla ice cream with rich, creamy texture',
    price: 99,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500',
    isAvailable: true
  },
  {
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
    price: 299,
    category: 'pizza',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500',
    isAvailable: true
  },
  {
    name: 'Classic Burger',
    description: 'Juicy beef patty with fresh vegetables and special sauce',
    price: 199,
    category: 'burger',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
    isAvailable: true
  },
  {
    name: 'Chicken Wings',
    description: 'Crispy fried chicken wings with special seasoning',
    price: 249,
    category: 'chicken',
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500',
    pieces: 6,
    isAvailable: true
  }
];

// Upload product image (convert to base64 and return)
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    console.log('=== Uploading Product Image ===');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Convert image buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    console.log('Image converted to base64 successfully:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      base64Length: base64Image.length
    });
    
    res.json({
      message: 'Image uploaded and converted successfully',
      imageUrl: base64Image,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ 
      message: 'Error processing image', 
      details: error.message || 'Unknown error' 
    });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    console.log('=== Fetching All Products ===');
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Current state:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database connection not available',
        details: 'Please try again later'
      });
    }

    let products = await Product.find().lean();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      message: 'Error fetching products',
      details: error.message || 'Unknown error'
    });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    console.log('=== Fetching Products by Category ===');
    console.log('Category:', req.params.category);
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Current state:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database connection not available',
        details: 'Please try again later'
      });
    }

    const products = await Product.find({ category: req.params.category });
    console.log(`Found ${products.length} products in category ${req.params.category}`);
    
    if (products.length === 0) {
      console.log(`No products found in category ${req.params.category}`);
      return res.json([]);
    }

    console.log('Products fetched successfully');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ 
      message: 'Error fetching products by category',
      details: error.message || 'Unknown error'
    });
  }
});

// Create a new product (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, description, price, category, image, pieces, orderTypes, isAvailable } = req.body;
    console.log('=== Creating New Product ===');
    console.log('Received product data:', { name, description, price, category, image, pieces, orderTypes, isAvailable });
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Current state:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database connection not available',
        details: 'Please try again later'
      });
    }
    
    // Validate required fields
    if (!name || !description || !price || !category) {
      console.log('Missing required fields:', { name, description, price, category });
      return res.status(400).json({ message: 'Name, description, price, and category are required' });
    }

    // Validate pieces for chicken category
    if (category === 'chicken' && (!pieces || pieces < 1)) {
      console.log('Invalid pieces for chicken:', pieces);
      return res.status(400).json({ message: 'Number of pieces is required for chicken products' });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      image: image || '/placeholder.svg',
      pieces: category === 'chicken' ? pieces : undefined,
      orderTypes: orderTypes || ['delivery', 'takeaway', 'dinein'],
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    console.log('Creating product:', product);
    const savedProduct = await product.save();
    console.log('Product created successfully:', savedProduct);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      message: 'Error creating product', 
      details: error.message || 'Unknown error' 
    });
  }
});

// Update a product (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, category, image, pieces, isAvailable, orderTypes } = req.body;
    console.log('=== Updating Product ===');
    console.log('Updating product:', { id: req.params.id, name, description, price, category, image, pieces, orderTypes });
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Current state:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database connection not available',
        details: 'Please try again later'
      });
    }
    
    const updateData = {
      name,
      description,
      price,
      category,
      image,
      isAvailable,
      orderTypes: orderTypes || ['delivery', 'takeaway', 'dinein'],
      updatedAt: new Date()
    };

    // Only include pieces if category is chicken
    if (category === 'chicken') {
      if (!pieces || pieces < 1) {
        return res.status(400).json({ message: 'Number of pieces is required for chicken products' });
      }
      updateData.pieces = pieces;
    } else {
      updateData.pieces = undefined;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      console.log('Product not found:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product updated successfully:', updatedProduct);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      message: 'Error updating product', 
      details: error.message || 'Unknown error' 
    });
  }
});

// Delete a product (admin only)
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== Deleting Product ===');
    console.log('Product ID:', req.params.id);
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Current state:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database connection not available',
        details: 'Please try again later'
      });
    }
    
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      console.log('Product not found:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product deleted successfully:', deletedProduct);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      message: 'Error deleting product', 
      details: error.message || 'Unknown error' 
    });
  }
});

module.exports = router;