
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { getOrder } from '../handlers/get_order';

describe('getOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing order', async () => {
    // Create a test order directly in the database
    const testOrder = {
      guest_email: 'test@example.com',
      guest_name: 'Test User',
      guest_address: '123 Test Street, Test City',
      total_amount: '99.99',
      stripe_payment_intent_id: 'pi_test123',
      status: 'paid' as const
    };

    const insertResult = await db.insert(ordersTable)
      .values(testOrder)
      .returning()
      .execute();

    const createdOrder = insertResult[0];

    // Retrieve the order using the handler
    const result = await getOrder(createdOrder.id);

    // Verify all fields
    expect(result.id).toEqual(createdOrder.id);
    expect(result.guest_email).toEqual('test@example.com');
    expect(result.guest_name).toEqual('Test User');
    expect(result.guest_address).toEqual('123 Test Street, Test City');
    expect(result.total_amount).toEqual(99.99);
    expect(typeof result.total_amount).toEqual('number');
    expect(result.stripe_payment_intent_id).toEqual('pi_test123');
    expect(result.status).toEqual('paid');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent order', async () => {
    await expect(getOrder(999)).rejects.toThrow(/Order with id 999 not found/i);
  });

  it('should handle order with null stripe_payment_intent_id', async () => {
    // Create order without stripe payment intent
    const testOrder = {
      guest_email: 'test@example.com',
      guest_name: 'Test User',
      guest_address: '123 Test Street, Test City',
      total_amount: '49.99',
      stripe_payment_intent_id: null,
      status: 'pending' as const
    };

    const insertResult = await db.insert(ordersTable)
      .values(testOrder)
      .returning()
      .execute();

    const createdOrder = insertResult[0];

    const result = await getOrder(createdOrder.id);

    expect(result.stripe_payment_intent_id).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.total_amount).toEqual(49.99);
  });
});
