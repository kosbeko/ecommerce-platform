
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Package, Store, Tag, Calendar } from 'lucide-react';
import type { ItemWithRelations } from '../../../server/src/schema';

interface ItemDetailsProps {
  item: ItemWithRelations;
  onAddToCart: (item: ItemWithRelations, quantity: number) => void;
}

export function ItemDetails({ item, onAddToCart }: ItemDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleAddToCart = () => {
    onAddToCart(item, quantity);
  };

  const maxQuantity = Math.min(item.stock_quantity, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-4">
          {item.images.length > 0 ? (
            <>
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={item.images[selectedImage]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {item.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {item.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                        selectedImage === index ? 'border-indigo-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${item.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h1>
            <div className="flex items-center space-x-2 mb-4">
              <Badge className="bg-indigo-100 text-indigo-800">
                <Tag className="h-3 w-3 mr-1" />
                {item.category.name}
              </Badge>
              <Badge variant="outline" className="border-green-200 text-green-700">
                <Store className="h-3 w-3 mr-1" />
                {item.store.name}
              </Badge>
            </div>
            <p className="text-3xl font-bold text-indigo-600 mb-4">${item.price.toFixed(2)}</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Stock Available:</span>
              <span className={`font-semibold ${item.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <Package className="h-4 w-4 inline mr-1" />
                {item.stock_quantity} units
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <Badge variant={item.stock_quantity > 0 ? 'default' : 'destructive'}>
                {item.stock_quantity > 0 ? '✅ In Stock' : '❌ Out of Stock'}
              </Badge>
            </div>
          </div>

          <Separator />

          {item.stock_quantity > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Quantity:</label>
                <Input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))
                  }
                  className="w-20"
                />
                <span className="text-sm text-gray-500">Max: {maxQuantity}</span>
              </div>
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart - ${(item.price * quantity).toFixed(2)}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Description */}
      {item.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{item.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Store className="h-5 w-5" />
            <span>Store Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-medium">Store Name:</span>
            <span className="ml-2">{item.store.name}</span>
          </div>
          {item.store.description && (
            <div>
              <span className="font-medium">About Store:</span>
              <p className="text-gray-600 mt-1">{item.store.description}</p>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            Store since {item.store.created_at.toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Product ID:</span>
              <span className="ml-2">#{item.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Category:</span>
              <span className="ml-2">{item.category.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Added:</span>
              <span className="ml-2">{item.created_at.toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Last Updated:</span>
              <span className="ml-2">{item.updated_at.toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
