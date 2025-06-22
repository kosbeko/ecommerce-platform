
import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Package, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { ItemDetails } from '@/components/ItemDetails';
import { AdminPanel } from '@/components/AdminPanel';
import { Cart } from '@/components/Cart';
import { Checkout } from '@/components/Checkout';
import type { ItemWithRelations, Category, Store } from '../../server/src/schema';

interface CartItem {
  item: ItemWithRelations;
  quantity: number;
}

function App() {
  // State management
  const [items, setItems] = useState<ItemWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [inStockOnly, setInStockOnly] = useState(false);

  // Load initial data
  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadStores = useCallback(async () => {
    try {
      const result = await trpc.getStores.query();
      setStores(result);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  }, []);

  const searchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.searchItems.query({
        query: searchQuery || undefined,
        category_id: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
        store_id: selectedStore !== 'all' ? parseInt(selectedStore) : undefined,
        min_price: priceRange.min ? parseFloat(priceRange.min) : undefined,
        max_price: priceRange.max ? parseFloat(priceRange.max) : undefined,
        in_stock_only: inStockOnly || undefined,
        limit: 50,
        offset: 0
      });
      setItems(result);
    } catch (error) {
      console.error('Failed to search items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStore, priceRange, inStockOnly]);

  useEffect(() => {
    loadCategories();
    loadStores();
    searchItems();
  }, [loadCategories, loadStores, searchItems]);

  // Cart functions
  const addToCart = (item: ItemWithRelations, quantity: number = 1) => {
    setCart((prev: CartItem[]) => {
      const existingItem = prev.find((cartItem: CartItem) => cartItem.item.id === item.id);
      if (existingItem) {
        return prev.map((cartItem: CartItem) =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }
      return [...prev, { item, quantity }];
    });
  };

  const updateCartQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev: CartItem[]) => prev.filter((item: CartItem) => item.item.id !== itemId));
    } else {
      setCart((prev: CartItem[]) => 
        prev.map((item: CartItem) => 
          item.item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total: number, item: CartItem) => total + (item.item.price * item.quantity), 0);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStore('all');
    setPriceRange({ min: '', max: '' });
    setInStockOnly(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-indigo-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">🛒 ShopHub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowCart(true)}
                className="relative border-indigo-200 hover:border-indigo-300"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-xs bg-red-500">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAdmin(true)}
                className="border-green-200 hover:border-green-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-1 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="browse" className="data-[state=active]:bg-indigo-100">
              🔍 Browse Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <Card className="bg-white/80 backdrop-blur-sm border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-indigo-600" />
                  <span>Search & Filter</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search Products</label>
                    <Input
                      placeholder="🔍 Search for items..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="border-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Store</label>
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                      <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
                        <SelectValue placeholder="All Stores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stores</SelectItem>
                        {stores.map((store: Store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Price ($)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={priceRange.min}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                      }
                      className="border-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Price ($)</label>
                    <Input
                      type="number"
                      placeholder="999"
                      value={priceRange.max}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                      }
                      className="border-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInStockOnly(e.target.checked)}
                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium">📦 In Stock Only</span>
                    </label>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={searchItems} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                    <Search className="h-4 w-4 mr-2" />
                    {isLoading ? 'Searching...' : 'Search'}
                  </Button>
                  <Button variant="outline" onClick={clearFilters} className="border-gray-300">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item: ItemWithRelations) => (
                <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-indigo-100 hover:border-indigo-300">
                  <CardHeader className="p-0">
                    {item.images.length > 0 && (
                      <div className="aspect-square overflow-hidden rounded-t-lg">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{item.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                          {item.category.name}
                        </Badge>
                        <Badge variant="outline" className="border-green-200 text-green-700">
                          🏪 {item.store.name}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-indigo-600">${item.price.toFixed(2)}</p>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>📦 Stock: {item.stock_quantity}</span>
                        <span className={item.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.stock_quantity > 0 ? '✅ In Stock' : '❌ Out of Stock'}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 space-y-2">
                    <div className="flex space-x-2 w-full">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 border-indigo-200 hover:border-indigo-300">
                            👁️ View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <ItemDetails item={item} onAddToCart={addToCart} />
                        </DialogContent>
                      </Dialog>
                      <Button
                        onClick={() => addToCart(item)}
                        disabled={item.stock_quantity === 0}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                      >
                        🛒 Add to Cart
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {items.length === 0 && !isLoading && (
              <Card className="bg-white/80 backdrop-blur-sm border-indigo-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No items found</h3>
                  <p className="text-gray-500 text-center">
                    Try adjusting your search criteria or browse all available products.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Shopping Cart ({getTotalItems()} items)</span>
            </DialogTitle>
            <DialogDescription>
              Review your items before checkout
            </DialogDescription>
          </DialogHeader>
          <Cart
            items={cart}
            onUpdateQuantity={updateCartQuantity}
            onClearCart={clearCart}
            onCheckout={() => {
              setShowCart(false);
              setShowCheckout(true);
            }}
            totalPrice={getTotalPrice()}
          />
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🛒 Checkout</DialogTitle>
            <DialogDescription>
              Complete your order as a guest
            </DialogDescription>
          </DialogHeader>
          <Checkout
            items={cart}
            totalPrice={getTotalPrice()}
            onOrderComplete={() => {
              setShowCheckout(false);
              clearCart();
            }}
            onCancel={() => setShowCheckout(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Admin Panel Dialog */}
      <Dialog open={showAdmin} onOpenChange={setShowAdmin}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Admin Panel</span>
            </DialogTitle>
            <DialogDescription>
              Manage categories, stores, and products
            </DialogDescription>
          </DialogHeader>
          <AdminPanel
            onItemCreated={() => {
              searchItems();
              setShowAdmin(false);
            }}
            categories={categories}
            stores={stores}
            onCategoriesUpdated={loadCategories}
            onStoresUpdated={loadStores}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
