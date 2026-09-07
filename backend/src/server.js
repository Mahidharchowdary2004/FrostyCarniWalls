const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');

// Override DNS to use Google's Public DNS to fix querySrv ECONNREFUSED
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { userRoutes } = require('./routes/user.routes');
const { errorHandler } = require('./middleware/error.middleware');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10); // Changed from 5000 to 5001
const MONGODB_URI = 'mongodb+srv://nallapanenimahidhar2004:R8WbjSwRSxe1u3wZ@cluster0.oclfqi3.mongodb.net/EatNSmile?retryWrites=true&w=majority&appName=Cluster0';

// Middleware
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend connection is good! Server is running.',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Error handling
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });