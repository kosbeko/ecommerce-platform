
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, categoriesTable, storesTable, itemsTable } from '../db/schema';
import { type CreatePaymentIntentInput } from '../schema';
import { createPaymentIntent } from '../handlers/create_payment_intent';
import { eq } from 'drizzle-orm';

describe('createPaymentIntent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestOrder = async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category description'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create store
    const storeResult = await db.insert(storesTable)
      .values({
        name: 'Test Store',
        description: 'Test store description',
        owner_email: 'owner@test.com'
      })
      .returning()
      .execute();
    const storeId = storeResult[0].id;

    // Create item
    await db.insert(itemsTable)
      .values({
        name: 'Test Item',
        description: 'Test item description',
        price: '29.99',
        stock_quantity: 10,
        images: ['https://example.com/image.jpg'],
        category_id: categoryId,
        store_id: storeId
      })
      .execute();

    // Create order
    const orderResult = await db.insert(ordersTable)
      .values({
        guest_email: 'guest@test.com',
        guest_name: 'Test Guest',
        guest_address: '123 Test St, Test City, TC 12345',
        total_amount: '59.98',
        status: 'pending'
      })
      .returning()
      .execute();

    return orderResult[0];
  };

  it('should create payment intent for valid order', async () => {
    const order = await createTestOrder();
    const input: CreatePaymentIntentInput = {
      order_id: order.id
    };

    const result = await createPaymentIntent(input);

    expect(result.client_secret).toBeDefined();
    expect(result.payment_intent_id).toBeDefined();
    expect(typeof result.client_secret).toBe('string');
    expect(typeof result.payment_intent_id).toBe('string');
    expect(result.client_secret.length).toBeGreaterThan(0);
    expect(result.payment_intent_id.length).toBeGreaterThan(0);
  });

  it('should throw error for non-existent order', async () => {
    const input: CreatePaymentIntentInput = {
      order_id: 999999
    };

    await expect(createPaymentIntent(input)).rejects.toThrow(/Order with ID 999999 not found/i);
  });

  it('should throw error for non-pending order', async () => {
    const order = await createTestOrder();

    // Update order status to paid
    await db.update(ordersTable)
      .set({ status: 'paid' })
      .where(eq(ordersTable.id, order.id))
      .execute();

    const input: CreatePaymentIntentInput = {
      order_id: order.id
    };

    await expect(createPaymentIntent(input)).rejects.toThrow(/Cannot create payment intent for order with status: paid/i);
  });

  it('should handle orders with different amounts', async () => {
    // Create order with different amount
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category description'
      })
      .returning()
      .execute();

    const storeResult = await db.insert(storesTable)
      .values({
        name: 'Test Store',
        description: 'Test store description',
        owner_email: 'owner@test.com'
      })
      .returning()
      .execute();

    const orderResult = await db.insert(ordersTable)
      .values({
        guest_email: 'guest@test.com',
        guest_name: 'Test Guest',
        guest_address: '123 Test St, Test City, TC 12345',
        total_amount: '125.50',
        status: 'pending'
      })
      .returning()
      .execute();

    const input: CreatePaymentIntentInput = {
      order_id: orderResult[0].id
    };

    const result = await createPaymentIntent(input);

    expect(result.client_secret).toBeDefined();
    expect(result.payment_intent_id).toBeDefined();
    expect(typeof result.client_secret).toBe('string');
    expect(typeof result.payment_intent_id).toBe('string');
  });

  it('should verify order exists in database', async () => {
    const order = await createTestOrder();
    const input: CreatePaymentIntentInput = {
      order_id: order.id
    };

    await createPaymentIntent(input);

    // Verify order still exists and has correct data
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, order.id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].guest_email).toEqual('guest@test.com');
    expect(parseFloat(orders[0].total_amount)).toEqual(59.98);
    expect(orders[0].status).toEqual('pending');
  });
});
