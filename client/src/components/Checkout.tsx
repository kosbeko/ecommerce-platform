
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, User, MapPin, Mail, CheckCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { ItemWithRelations, CreateOrderInput } from '../../../server/src/schema';

interface CartItem {
  item: ItemWithRelations;
  quantity: number;
}

interface CheckoutProps {
  items: CartItem[];
  totalPrice: number;
  onOrderComplete: () => void;
  onCancel: () => void;
}

export function Checkout({ items, totalPrice, onOrderComplete, onCancel }: CheckoutProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create order
      const orderInput: CreateOrderInput = {
        guest_name: guestInfo.name,
        guest_email: guestInfo.email,
        guest_address: guestInfo.address,
        items: items.map((cartItem: CartItem) => ({
          item_id: cartItem.item.id,
          quantity: cartItem.quantity
        }))
      };

      const order = await trpc.createOrder.mutate(orderInput);
      
      // Create payment intent
      const paymentIntent = await trpc.createPaymentIntent.mutate({
        order_id: order.id
      });

      // In a real app, you would integrate with Stripe here
      console.log('Payment Intent:', paymentIntent);
      
      // For demo purposes, we'll simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update order status to paid
      await trpc.updateOrderStatus.mutate({
        id: order.id,
        status: 'paid',
        stripe_payment_intent_id: paymentIntent.payment_intent_id
      });

      setOrderComplete(true);
      
      // Auto-close after showing success
      setTimeout(() => {
        onOrderComplete();
      }, 3000);

    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to process order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-green-600">🎉 Order Complete!</h2>
        <p className="text-gray-600">
          Thank you for your purchase! You will receive a confirmation email shortly.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            💳 Payment processed successfully<br />
            📧 Confirmation sent to {guestInfo.email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Order Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((cartItem: CartItem) => (
            <div key={cartItem.item.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                  {cartItem.item.images.length > 0 && (
                    <img
                      src={cartItem.item.images[0]}
                      alt={cartItem.item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{cartItem.item.name}</p>
                  <div className="flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs">
                      {cartItem.item.category.name}
                    </Badge>
                    <span className="text-xs text-gray-500">× {cartItem.quantity}</span>
                  </div>
                </div>
              </div>
              <p className="font-semibold">${(cartItem.item.price * cartItem.quantity).toFixed(2)}</p>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-between items-center text-lg font-bold text-indigo-600">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Guest Information Form */}
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Guest Checkout</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium mb-2">
                <User className="h-4 w-4" />
                <span>Full Name *</span>
              </label>
              <Input
                required
                value={guestInfo.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGuestInfo((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter your full name"
                className="border-indigo-200 focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium mb-2">
                <Mail className="h-4 w-4" />
                <span>Email Address *</span>
              </label>
              <Input
                type="email"
                required
                value={guestInfo.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGuestInfo((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="your@email.com"
                className="border-indigo-200 focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium mb-2">
                <MapPin className="h-4 w-4" />
                <span>Shipping Address *</span>
              </label>
              <Input
                required
                value={guestInfo.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGuestInfo((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="123 Main St, City, State, ZIP"
                className="border-indigo-200 focus:border-indigo-400"
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💳 <strong>Demo Payment:</strong> This is a demonstration. No actual payment will be processed.
                In a real application, Stripe payment processing would be integrated here.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Processing...' : `Place Order - $${totalPrice.toFixed(2)}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
