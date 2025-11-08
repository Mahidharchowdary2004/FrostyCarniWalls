import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ProductGrid = ({ selectedCategory, onAddToCart, isLoggedIn, onLoginRequired }) => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting to fetch products...');
      const data = await api.getProducts();
      console.log('Products fetched successfully:', data);
      
      // Debug image data
      data.forEach(product => {
        console.log(`Product: ${product.name}`);
        console.log(`Image URL: ${product.image}`);
        console.log(`Image type: ${typeof product.image}`);
        console.log(`Image length: ${product.image?.length}`);
        console.log(`Is base64: ${product.image?.startsWith('data:') ? 'Yes' : 'No'}`);
        console.log('---');
      });
      
      setProducts(data);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error in fetchProducts:', err);
      const errorMessage = err.message || 'Failed to fetch products';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRetry = () => {
    if (retryCount < 3) { // Limit retries to 3 attempts
      setRetryCount(prev => prev + 1);
      console.log(`Retry attempt ${retryCount + 1} of 3`);
      fetchProducts();
    } else {
      const message = "Maximum retry attempts reached. Please check if the server is running and try again later.";
      console.error(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  };

  // Helper function to check if an image source is valid
  const isValidImageSrc = (src) => {
    return src && src !== '/placeholder.svg' && (src.startsWith('http') || src.startsWith('data:'));
  };

  // Helper function to get fallback image
  const getFallbackImage = (product) => {
    const categoryEmojis = {
      'ice-cream': '🍦',
      'pizza': '🍕',
      'burger': '🍔',
      'chicken': '🍗'
    };
    
    return (
      <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">
            {categoryEmojis[product.category] || '🍽️'}
          </div>
          <p className="text-xs text-gray-600 font-medium">{product.name}</p>
        </div>
      </div>
    );
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const handleAddToCart = (product) => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    onAddToCart(product);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'ice-cream': return 'bg-blue-100 text-blue-800';
      case 'pizza': return 'bg-red-100 text-red-800';
      case 'burger': return 'bg-yellow-100 text-yellow-800';
      case 'chicken': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'ice-cream': return 'Ice Cream';
      case 'pizza': return 'Pizza';
      case 'burger': return 'Burger';
      case 'chicken': return 'Chicken';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-lg text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600 mb-4">
            {retryCount >= 3 
              ? "We've tried multiple times but couldn't connect to the server."
              : "We're having trouble connecting to the server."}
          </p>
          <Button 
            onClick={handleRetry}
            disabled={retryCount >= 3}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-lg text-gray-600">No products found in this category.</p>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        {selectedCategory === 'all' ? 'Our Menu' : `${getCategoryName(selectedCategory)} Collection`}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product._id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-orange-100">
            <CardHeader className="p-0">
              <div className="relative overflow-hidden rounded-t-lg">
                {isValidImageSrc(product.image) ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      console.error('Image failed to load for product:', product.name, 'URL:', product.image);
                      // Replace the image element with fallback
                      const imgElement = e.target as HTMLImageElement;
                      const fallbackDiv = document.createElement('div');
                      fallbackDiv.innerHTML = `
                        <div class="w-full h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                          <div class="text-center">
                            <div class="text-4xl mb-2">${product.category === 'ice-cream' ? '🍦' : product.category === 'pizza' ? '🍕' : product.category === 'burger' ? '🍔' : product.category === 'chicken' ? '🍗' : '🍽️'}</div>
                            <p class="text-xs text-gray-600 font-medium">${product.name}</p>
                          </div>
                        </div>
                      `;
                      imgElement.parentNode?.replaceChild(fallbackDiv.firstElementChild!, imgElement);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully for product:', product.name);
                    }}
                  />
                ) : (
                  getFallbackImage(product)
                )}
                <Badge className={`absolute top-3 left-3 ${getCategoryColor(product.category)}`}>
                  {getCategoryName(product.category)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg font-semibold text-gray-800 mb-2">
                {product.name}
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm mb-3">
                {product.description}
              </CardDescription>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">
                  ₹{product.price}
                </span>
                <Button 
                  onClick={() => handleAddToCart(product)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
