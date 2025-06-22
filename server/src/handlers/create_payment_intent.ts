
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type CreatePaymentIntentInput, type PaymentIntentResponse } from '../schema';
import { eq } from 'drizzle-orm';

// Mock Stripe configuration - in real implementation, this would use actual Stripe SDK
const STRIPE_SECRET_KEY = process.env['STRIPE_SECRET_KEY'] || 'sk_test_mock';

export const createPaymentIntent = async (input: CreatePaymentIntentInput): Promise<PaymentIntentResponse> => {
  try {
    // Fetch the order to get the total amount
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, input.order_id))
      .execute();

    if (orders.length === 0) {
      throw new Error(`Order with ID ${input.order_id} not found`);
    }

    const order = orders[0];
    const totalAmount = parseFloat(order.total_amount); // Convert numeric to number

    // Validate order status - only allow payment intents for pending orders
    if (order.status !== 'pending') {
      throw new Error(`Cannot create payment intent for order with status: ${order.status}`);
    }

    // Convert amount to cents for Stripe (multiply by 100)
    const amountInCents = Math.round(totalAmount * 100);

    // Mock Stripe payment intent creation
    // In real implementation, this would be:
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amountInCents,
    //   currency: 'usd',
    //   metadata: { order_id: input.order_id.toString() }
    // });

    const mockPaymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;

    return {
      client_secret: mockClientSecret,
      payment_intent_id: mockPaymentIntentId
    };
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    throw error;
  }
};
