import { useState, useEffect } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const MenuView = ({ isOpen, onClose, onAddToCart, isLoggedIn, onLoginRequired }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache for products
  const [productsCache, setProductsCache] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      // Check if we have valid cached data
      const now = Date.now();
      if (productsCache && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('Using cached products');
        setProducts(productsCache);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      console.log('Fetching products from API...');
      const data = await api.getProducts();
      console.log('Products fetched successfully');
      
      // Update cache
      setProductsCache(data);
      setLastFetchTime(now);
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
      toast({
        title: "Error",
        description: "Failed to load products. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'ice-cream', name: 'Ice Cream' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'burger', name: 'Burgers' },
    { id: 'chicken', name: 'Chicken' },
  ];

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
      <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center rounded-t-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">
            {categoryEmojis[product.category] || '🍽️'}
          </div>
          <p className="text-xs text-gray-600 font-medium">{product.name}</p>
        </div>
      </div>
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <Card className="relative w-full max-w-6xl mx-4 max-h-[90vh] bg-white">
          <CardContent className="p-6 flex items-center justify-center">
            <p className="text-lg text-gray-600">Loading menu items...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <Card className="relative w-full max-w-6xl mx-4 max-h-[90vh] bg-white">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <Button onClick={fetchProducts} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <Card className="relative w-full max-w-6xl mx-4 max-h-[90vh] bg-white">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <CardTitle className="flex items-center justify-between">
            <span>Our Complete Menu</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? 
                    "bg-gradient-to-r from-orange-500 to-red-500 text-white" : 
                    ""}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product._id} className="group hover:shadow-lg transition-all duration-300">
                  <div className="relative">
                    {isValidImageSrc(product.image) ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.error('Image failed to load for product:', product.name, 'URL:', product.image);
                          // Replace the image element with fallback
                          const imgElement = e.target as HTMLImageElement;
                          const fallbackDiv = document.createElement('div');
                          fallbackDiv.innerHTML = `
                            <div class="w-full h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center rounded-t-lg">
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
                      {product.category.replace('-', ' ')}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{product.description}</p>
                    {product.pieces && (
                      <p className="text-xs text-gray-500 mb-2">
                        <strong>Pieces:</strong> {product.pieces}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mb-3">
                      <strong>Ingredients:</strong> {product.ingredients}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-600">₹{product.price.toFixed(2)}</span>
                      <Button 
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                        disabled={!product.isAvailable}
                      >
                        {product.isAvailable ? 'Add to Cart' : 'Not Available'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No items found matching your search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuView;
