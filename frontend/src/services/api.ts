import axios from 'axios';

const baseURL = 'http://localhost:5001/api';

const axiosInstance = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    // Handle connection refused errors
    if (error.code === 'ERR_CONNECTION_REFUSED' || error.code === 'ECONNABORTED') {
      console.error('Server is not running or not accessible');
      return Promise.reject(new Error('Server is not running. Please make sure the backend server is started.'));
    }
    
    // Handle 503 errors
    if (error.response?.status === 503) {
      console.error('Service temporarily unavailable - Will retry automatically');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return axiosInstance(error.config);
    }
    
    console.error('API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// Add retry logic for failed requests
const retryRequest = async (fn: () => Promise<any>, retries = 2, delay = 1000) => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;
    
    if (error.code === 'ECONNABORTED' || error.response?.status === 500 || !error.response) {
      console.log(`Retrying request... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    
    throw error;
  }
};

export const api = {
  // Add server status check
  checkServerStatus: async () => {
    try {
      const response = await axiosInstance.get('/');
      return response.data;
    } catch (error) {
      console.error('Error checking server status:', error);
      throw error;
    }
  },

  // Orders
  getOrders: async () => {
    return retryRequest(async () => {
      const response = await axiosInstance.get('/orders');
      return response.data;
    });
  },

  getUserOrders: async (userId) => {
    return retryRequest(async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const response = await axiosInstance.get(`/orders/user/${userId}`);
      if (!response.data) {
        throw new Error('No data received from server');
      }
      const rawOrders = Array.isArray(response.data) ? response.data : [response.data];
      return rawOrders.map(order => ({
        _id: order._id || order.id,
        items: (order.items || []).map(item => ({
          id: item.id || item._id,
          name: item.name || 'Unknown Item',
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
          image: item.image || ''
        })),
        totalPrice: Number(order.totalPrice) || 0,
        status: order.status || 'pending',
        customerInfo: {
          userName: order.customerInfo?.userName || 'Guest',
          phone: order.customerInfo?.phone || '',
          address: order.customerInfo?.address || '',
          paymentMethod: order.customerInfo?.paymentMethod || 'cash',
          deliveryOption: order.customerInfo?.deliveryOption || 'delivery'
        },
        createdAt: order.createdAt || new Date().toISOString()
      }));
    });
  },

  createOrder: async (orderData) => {
    try {
      const response = await axiosInstance.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Auth
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/users/signin', credentials);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/users/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  },

  // Products
  getProducts: async () => {
    try {
      const response = await axiosInstance.get('/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  getProduct: async (id) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  addProduct: async (productData) => {
    try {
      const response = await axiosInstance.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('Error in addProduct:', error);
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const response = await axiosInstance.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error('Error in updateProduct:', error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await axiosInstance.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      throw error;
    }
  },

  // User methods
  updateUserProfile: async (userId, userData) => {
    try {
      const response = await axiosInstance.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  },

  updateUserPassword: async (userId, passwordData) => {
    try {
      const response = await axiosInstance.put(`/users/${userId}/password`, passwordData);
      return response.data;
    } catch (error) {
      console.error('Error in updateUserPassword:', error);
      throw error;
    }
  },

  updateUserPreferences: async (userId: string, preferences: any) => {
    try {
      const response = await axiosInstance.put(`/users/${userId}/preferences`, preferences);
      return response.data;
    } catch (error) {
      console.error('Error in updateUserPreferences:', error);
      throw error;
    }
  },

  cancelOrder: async (orderId: string) => {
    return retryRequest(async () => {
      try {
        const response = await axiosInstance.put(`/orders/${orderId}/cancel`);
        return response.data;
      } catch (error) {
        console.error('Error cancelling order:', error);
        throw error;
      }
    });
  }
}; 