
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Package, Store, Tag, CheckCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Category, Store as StoreType, CreateCategoryInput, CreateStoreInput, CreateItemInput } from '../../../server/src/schema';

interface AdminPanelProps {
  onItemCreated: () => void;
  categories: Category[];
  stores: StoreType[];
  onCategoriesUpdated: () => void;
  onStoresUpdated: () => void;
}

export function AdminPanel({ onItemCreated, categories, stores, onCategoriesUpdated, onStoresUpdated }: AdminPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Category form state
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: '',
    description: null
  });

  // Store form state
  const [storeForm, setStoreForm] = useState<CreateStoreInput>({
    name: '',
    description: null,
    owner_email: ''
  });

  // Item form state
  const [itemForm, setItemForm] = useState<CreateItemInput>({
    name: '',
    description: null,
    price: 0,
    stock_quantity: 0,
    images: [],
    category_id: 0,
    store_id: 0
  });

  const [imageInput, setImageInput] = useState('');

  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await trpc.createCategory.mutate(categoryForm);
      setCategoryForm({ name: '', description: null });
      onCategoriesUpdated();
      showMessage('✅ Category created successfully!');
    } catch (err) {
      console.error('Failed to create category:', err);
      showMessage('Failed to create category. Please try again.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await trpc.createStore.mutate(storeForm);
      setStoreForm({ name: '', description: null, owner_email: '' });
      onStoresUpdated();
      showMessage('🏪 Store created successfully!');
    } catch (err) {
      console.error('Failed to create store:', err);
      showMessage('Failed to create store. Please try again.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await trpc.createItem.mutate(itemForm);
      setItemForm({
        name: '',
        description: null,
        price: 0,
        stock_quantity: 0,
        images: [],
        category_id: 0,
        store_id: 0
      });
      setImageInput('');
      onItemCreated();
      showMessage('📦 Product created successfully!');
    } catch (err) {
      console.error('Failed to create item:', err);
      showMessage('Failed to create product. Please try again.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addImageUrl = () => {
    if (imageInput.trim()) {
      setItemForm((prev: CreateItemInput) => ({
        ...prev,
        images: [...prev.images, imageInput.trim()]
      }));
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setItemForm((prev: CreateItemInput) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">📦 Products</TabsTrigger>
          <TabsTrigger value="categories">🏷️ Categories</TabsTrigger>
          <TabsTrigger value="stores">🏪 Stores</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Add New Product</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Product Name *</label>
                    <Input
                      required
                      value={itemForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setItemForm((prev: CreateItemInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Price ($) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={itemForm.price || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setItemForm((prev: CreateItemInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={itemForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setItemForm((prev: CreateItemInput) => ({ ...prev, description: e.target.value || null }))
                    }
                    placeholder="Product description (optional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Stock Quantity *</label>
                    <Input
                      type="number"
                      min="0"
                      required
                      value={itemForm.stock_quantity || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setItemForm((prev: CreateItemInput) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category *</label>
                    <Select
                      value={itemForm.category_id > 0 ? itemForm.category_id.toString() : 'none'}
                      onValueChange={(value: string) =>
                        setItemForm((prev: CreateItemInput) => ({ ...prev, category_id: value === 'none' ? 0 : parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select category</SelectItem>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Store *</label>
                    <Select
                      value={itemForm.store_id > 0 ? itemForm.store_id.toString() : 'none'}
                      onValueChange={(value: string) =>
                        setItemForm((prev: CreateItemInput) => ({ ...prev, store_id: value === 'none' ? 0 : parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select store" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select store</SelectItem>
                        {stores.map((store: StoreType) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Product Images</label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={imageInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addImageUrl} variant="outline">
                      Add Image
                    </Button>
                  </div>
                  {itemForm.images.length > 0 && (
                    <div className="space-y-2">
                      {itemForm.images.map((url: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <span className="flex-1 text-sm truncate">{url}</span>
                          <Button
                            type="button"
                            onClick={() => removeImage(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || categories.length === 0 || stores.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Creating Product...' : 'Create Product'}
                </Button>

                {(categories.length === 0 || stores.length === 0) && (
                  <Alert>
                    <AlertDescription>
                      You need at least one category and one store before creating products.
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="h-5 w-5" />
                  <span>Add New Category</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category Name *</label>
                    <Input
                      required
                      value={categoryForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCategoryForm((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Electronics, Clothing, Books"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={categoryForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCategoryForm((prev: CreateCategoryInput) => ({ ...prev, description: e.target.value || null }))
                      }
                      placeholder="Category description (optional)"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create Category'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-gray-500">No categories created yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((category: Category) => (
                      <div key={category.id} className="border p-3 rounded-lg">
                        <h4 className="font-semibold">{category.name}</h4>
                        {category.description && (
                          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Created: {category.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stores Tab */}
        <TabsContent value="stores">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Store className="h-5 w-5" />
                  <span>Add New Store</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStore} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Store Name *</label>
                    <Input
                      required
                      value={storeForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setStoreForm((prev: CreateStoreInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Tech World, Fashion Hub"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Owner Email *</label>
                    <Input
                      type="email"
                      required
                      value={storeForm.owner_email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setStoreForm((prev: CreateStoreInput) => ({ ...prev, owner_email: e.target.value }))
                      }
                      placeholder="owner@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={storeForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setStoreForm((prev: CreateStoreInput) => ({ ...prev, description: e.target.value || null }))
                      }
                      placeholder="Store description (optional)"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create Store'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Stores</CardTitle>
              </CardHeader>
              <CardContent>
                {stores.length === 0 ? (
                  <p className="text-gray-500">No stores created yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stores.map((store: StoreType) => (
                      <div key={store.id} className="border p-3 rounded-lg">
                        <h4 className="font-semibold">{store.name}</h4>
                        <p className="text-sm text-indigo-600">{store.owner_email}</p>
                        {store.description && (
                          <p className="text-sm text-gray-600 mt-1">{store.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Created: {store.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
