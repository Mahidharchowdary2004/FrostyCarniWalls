import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/services/api';
import { Textarea } from '@/components/ui/textarea';

const CATEGORIES = [
  { id: 'ice-cream', name: 'Ice Cream', emoji: '🍦' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕' },
  { id: 'burger', name: 'Burgers', emoji: '🍔' },
  { id: 'chicken', name: 'Chicken', emoji: '🍗' },
];

const ProductManagement = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    image: '',
    pieces: '',
    isAvailable: true,
    orderTypes: ['delivery', 'takeaway', 'dinein']
  });

  // Function to format price in Indian Rupees
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      image: '',
      pieces: '',
      isAvailable: true,
      orderTypes: ['delivery', 'takeaway', 'dinein']
    });
    setSelectedFile(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Product name is required.",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.category) {
      toast({
        title: "Error",
        description: "Please select a category.",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price.",
        variant: "destructive"
      });
      return false;
    }
    if (formData.category === 'chicken' && (!formData.pieces || parseInt(formData.pieces) <= 0)) {
      toast({
        title: "Error",
        description: "Please enter the number of pieces for chicken products.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      category: value,
      // Reset pieces when category changes
      pieces: value === 'chicken' ? prev.pieces : ''
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploading(true);
      const response = await fetch('http://localhost:5001/api/products/upload-image', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      let imageUrl = formData.image;
      
      // Upload image if file is selected
      if (selectedFile) {
        try {
          imageUrl = await uploadImage(selectedFile);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload image. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }
      
      const productData: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        image: imageUrl || '/placeholder.svg',
        isAvailable: formData.isAvailable,
        orderTypes: formData.orderTypes
      };
      
      // Only add pieces if category is chicken
      if (formData.category === 'chicken') {
        productData.pieces = parseInt(formData.pieces);
      }

      await api.addProduct(productData);
      await fetchProducts();
      setIsAddDialogOpen(false);
      resetForm();
      
      toast({
        title: "Success!",
        description: "Product added successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      let imageUrl = formData.image;
      
      // Upload new image if file is selected
      if (selectedFile) {
        try {
          imageUrl = await uploadImage(selectedFile);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload image. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }
      
      const productData: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        image: imageUrl || '/placeholder.svg',
        isAvailable: formData.isAvailable,
        orderTypes: formData.orderTypes
      };
      
      // Only add pieces if category is chicken
      if (formData.category === 'chicken') {
        productData.pieces = parseInt(formData.pieces);
      }

      await api.updateProduct(editingProduct._id, productData);
      await fetchProducts();
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      
      toast({
        title: "Success!",
        description: "Product updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      setIsSubmitting(true);
      await api.deleteProduct(deletingProduct._id);
      await fetchProducts();
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      
      toast({
        title: "Success!",
        description: "Product deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price.toString(),
      image: product.image,
      pieces: product.pieces?.toString() || '',
      isAvailable: product.isAvailable,
      orderTypes: product.orderTypes || ['delivery', 'takeaway', 'dinein']
    });
    setSelectedFile(null);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    if (categoryFilter === 'all') return true;
    return product.category === categoryFilter;
  });

  const ProductForm = ({ onSubmit, isEdit = false }) => (
    <div className="max-h-[75vh] overflow-y-auto pr-2">
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-6">
          {/* Product Name Field */}
          <div className="group">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-800 mb-3 block flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter a catchy product name..."
              required
              disabled={isSubmitting}
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-300 text-gray-800 placeholder-gray-400 bg-white shadow-sm hover:shadow-md group-hover:border-orange-300"
            />
          </div>

          {/* Description Field */}
          <div className="group">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-800 mb-3 block flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what makes this product special..."
              rows={4}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-300 text-gray-800 placeholder-gray-400 bg-white shadow-sm hover:shadow-md group-hover:border-orange-300 resize-none"
            />
          </div>
          
          {/* Category and Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Field */}
            <div className="group">
              <Label htmlFor="category" className="text-sm font-semibold text-gray-800 mb-3 block flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Category <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={handleSelectChange}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md group-hover:border-orange-300">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 border-gray-100 shadow-2xl">
                  {CATEGORIES.map(category => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id} 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 focus:bg-orange-50 rounded-lg mx-2 my-1 cursor-pointer transition-colors"
                    >
                      <span className="text-lg">{category.emoji}</span>
                      <span className="font-medium">{category.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Price Field */}
            <div className="group">
              <Label htmlFor="price" className="text-sm font-semibold text-gray-800 mb-3 block flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Price <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">₹</span>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                  disabled={isSubmitting}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-300 text-gray-800 placeholder-gray-400 bg-white shadow-sm hover:shadow-md group-hover:border-orange-300"
                />
              </div>
            </div>
          </div>

          {/* Pieces Field (conditional) */}
          {formData.category === 'chicken' && (
            <div className="group animate-fadeIn">
              <Label htmlFor="pieces" className="text-sm font-semibold text-gray-800 mb-3 block flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Number of Pieces <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pieces"
                name="pieces"
                type="number"
                min="1"
                value={formData.pieces}
                onChange={handleInputChange}
                placeholder="How many pieces?"
                required
                disabled={isSubmitting}
                className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-300 text-gray-800 placeholder-gray-400 bg-white shadow-sm hover:shadow-md group-hover:border-orange-300"
              />
            </div>
          )}
        
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">Product Image</Label>
          
          {/* File Upload Option */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <Label htmlFor="imageFile" className="text-sm font-medium text-gray-700">Upload Image File</Label>
            </div>
            <div className="relative">
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isSubmitting || uploading}
                className="w-full rounded-lg border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>File selected: {selectedFile.name}</span>
              </div>
            )}
            {uploading && (
              <div className="flex items-center space-x-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading image...</span>
              </div>
            )}
            <p className="text-xs text-gray-500">Supports: PNG, JPG, GIF (max 5MB)</p>
          </div>
          
          {/* OR Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-medium">OR</span>
            </div>
          </div>
          
          {/* URL Input Option */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <Label htmlFor="image" className="text-sm font-medium text-gray-700">Enter Image URL</Label>
            </div>
            <Input
              id="image"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              disabled={isSubmitting || uploading}
              className="w-full rounded-lg border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
            />
            <p className="text-xs text-gray-500">Enter a direct link to an image</p>
          </div>
          
          {/* Image Preview */}
          {formData.image && (
            <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
              <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Image Preview</span>
              </Label>
              <div className="flex items-center space-x-4">
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  className="w-24 h-24 object-cover rounded-lg border-2 border-white shadow-md"
                  onError={(e) => {
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.src = '/placeholder.svg';
                    toast({
                      title: "Error",
                      description: "Failed to load image. Using placeholder instead.",
                      variant: "destructive"
                    });
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Image loaded successfully</p>
                  <p className="text-xs text-gray-500 mt-1">This preview will be used for the product</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Order Types</Label>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="delivery"
                checked={formData.orderTypes.includes('delivery')}
                onChange={(e) => {
                  const newOrderTypes = e.target.checked
                    ? [...formData.orderTypes, 'delivery']
                    : formData.orderTypes.filter(type => type !== 'delivery');
                  setFormData({ ...formData, orderTypes: newOrderTypes });
                }}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <Label htmlFor="delivery" className="text-sm font-medium">🚚 Delivery</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="takeaway"
                checked={formData.orderTypes.includes('takeaway')}
                onChange={(e) => {
                  const newOrderTypes = e.target.checked
                    ? [...formData.orderTypes, 'takeaway']
                    : formData.orderTypes.filter(type => type !== 'takeaway');
                  setFormData({ ...formData, orderTypes: newOrderTypes });
                }}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <Label htmlFor="takeaway" className="text-sm font-medium">🛍️ Takeaway</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dinein"
                checked={formData.orderTypes.includes('dinein')}
                onChange={(e) => {
                  const newOrderTypes = e.target.checked
                    ? [...formData.orderTypes, 'dinein']
                    : formData.orderTypes.filter(type => type !== 'dinein');
                  setFormData({ ...formData, orderTypes: newOrderTypes });
                }}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <Label htmlFor="dinein" className="text-sm font-medium">🍽️ Dine-in</Label>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="isAvailable"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleInputChange}
            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            disabled={isSubmitting}
          />
          <Label htmlFor="isAvailable" className="text-sm font-medium">Product is available</Label>
        </div>
        </div>
        
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <Button 
            type="submit" 
            className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              isEdit ? 'Update Product' : 'Add Product'
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingProduct(null);
            }}
            disabled={isSubmitting}
            className="h-12 px-6 border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-300"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm onSubmit={handleAddProduct} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {products.length === 0 
                ? "No products found. Add your first product!"
                : "No products found in this category."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Pieces</TableHead>
                  <TableHead>Order Types</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        {product.image && product.image !== '/placeholder.svg' ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const imgElement = e.target as HTMLImageElement;
                              imgElement.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="capitalize">
                      {CATEGORIES.find(c => c.id === product.category)?.emoji} {product.category.replace('-', ' ')}
                    </TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      {product.category === 'chicken' ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {product.pieces} pcs
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                          N/A
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {product.orderTypes?.includes('delivery') && (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 flex items-center gap-1">
                            <span>🚚</span> Delivery
                          </span>
                        )}
                        {product.orderTypes?.includes('takeaway') && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 flex items-center gap-1">
                            <span>🛍️</span> Takeaway
                          </span>
                        )}
                        {product.orderTypes?.includes('dinein') && (
                          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 flex items-center gap-1">
                            <span>🍽️</span> Dine-in
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(product)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm onSubmit={handleEditProduct} isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingProduct(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
