
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import type { ItemWithRelations } from '../../../server/src/schema';

interface CartItem {
  item: ItemWithRelations;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  totalPrice: number;
}

export function Cart({ items, onUpdateQuantity, onClearCart, onCheckout, totalPrice }: CartProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
        <p className="text-gray-500">Add some items to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {items.map((cartItem: CartItem) => (
          <Card key={cartItem.item.id} className="border-indigo-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                {/* Item Image */}
                <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  {cartItem.item.images.length > 0 ? (
                    <img
                      src={cartItem.item.images[0]}
                      alt={cartItem.item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{cartItem.item.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {cartItem.item.category.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {cartItem.item.store.name}
                    </Badge>
                  </div>
                  <p className="text-indigo-600 font-semibold mt-1">
                    ${cartItem.item.price.toFixed(2)} each
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                    disabled={cartItem.quantity <= 1}
                    className="h-8 w-8 p-0"
                
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={cartItem.item.stock_quantity}
                    value={cartItem.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newQuantity = parseInt(e.target.value) || 1;
                      onUpdateQuantity(cartItem.item.id, Math.min(newQuantity, cartItem.item.stock_quantity));
                    }}
                    className="w-16 h-8 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                    disabled={cartItem.quantity >= cartItem.item.stock_quantity}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Item Total & Remove */}
                <div className="text-right flex flex-col items-end space-y-2">
                  <p className="font-semibold text-lg">
                    ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateQuantity(cartItem.item.id, 0)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Cart Summary */}
      <Card className="bg-indigo-50 border-indigo-200">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Items ({items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)}):</span>
              <span className="font-semibold">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-indigo-600">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={onClearCart}
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Cart
        </Button>
        <Button
          onClick={onCheckout}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          size="lg"
        >
          🛒 Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
