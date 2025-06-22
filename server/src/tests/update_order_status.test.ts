
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, categoriesTable, storesTable, itemsTable } from '../db/schema';
import { type UpdateOrderStatusInput } from '../schema';
import { updateOrderStatus } from '../handlers/update_order_status';
import { eq } from 'drizzle-orm';

describe('updateOrderStatus', () => {
  let orderId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        guest_email: 'test@example.com',
        guest_name: 'Test User',
        guest_address: '123 Test St',
        total_amount: '99.99',
        status: 'pending'
      })
      .returning()
      .execute();
    
    orderId = orderResult[0].id;
  });

  afterEach(resetDB);

  it('should update order status', async () => {
    const input: UpdateOrderStatusInput = {
      id: orderId,
      status: 'paid'
    };

    const result = await updateOrderStatus(input);

    expect(result.id).toEqual(orderId);
    expect(result.status).toEqual('paid');
    expect(result.guest_email).toEqual('test@example.com');
    expect(result.guest_name).toEqual('Test User');
    expect(result.total_amount).toEqual(99.99);
    expect(typeof result.total_amount).toEqual('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update order status with stripe payment intent', async () => {
    const input: UpdateOrderStatusInput = {
      id: orderId,
      status: 'paid',
      stripe_payment_intent_id: 'pi_test_123456'
    };

    const result = await updateOrderStatus(input);

    expect(result.id).toEqual(orderId);
    expect(result.status).toEqual('paid');
    expect(result.stripe_payment_intent_id).toEqual('pi_test_123456');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateOrderStatusInput = {
      id: orderId,
      status: 'shipped',
      stripe_payment_intent_id: 'pi_test_789'
    };

    await updateOrderStatus(input);

    // Verify changes were saved
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].status).toEqual('shipped');
    expect(orders[0].stripe_payment_intent_id).toEqual('pi_test_789');
    expect(orders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update all valid order statuses', async () => {
    const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;

    for (const status of statuses) {
      const input: UpdateOrderStatusInput = {
        id: orderId,
        status: status
      };

      const result = await updateOrderStatus(input);
      expect(result.status).toEqual(status);
    }
  });

  it('should throw error for non-existent order', async () => {
    const input: UpdateOrderStatusInput = {
      id: 99999,
      status: 'paid'
    };

    await expect(updateOrderStatus(input)).rejects.toThrow(/Order with id 99999 not found/i);
  });

  it('should handle null stripe_payment_intent_id', async () => {
    // First set a payment intent ID
    await updateOrderStatus({
      id: orderId,
      status: 'paid',
      stripe_payment_intent_id: 'pi_test_123'
    });

    // Then clear it by setting to empty string
    const input: UpdateOrderStatusInput = {
      id: orderId,
      status: 'cancelled',
      stripe_payment_intent_id: ''
    };

    const result = await updateOrderStatus(input);

    expect(result.status).toEqual('cancelled');
    expect(result.stripe_payment_intent_id).toEqual('');
  });
});
