
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, orderItemsTable, categoriesTable, storesTable, itemsTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

describe('createOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an order with items', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic items'
      })
      .returning()
      .execute();

    const storeResult = await db.insert(storesTable)
      .values({
        name: 'Test Store',
        description: 'A test store',
        owner_email: 'owner@test.com'
      })
      .returning()
      .execute();

    const itemResult1 = await db.insert(itemsTable)
      .values({
        name: 'Test Item 1',
        description: 'First test item',
        price: '29.99',
        stock_quantity: 10,
        images: ['image1.jpg'],
        category_id: categoryResult[0].id,
        store_id: storeResult[0].id
      })
      .returning()
      .execute();

    const itemResult2 = await db.insert(itemsTable)
      .values({
        name: 'Test Item 2',
        description: 'Second test item',
        price: '15.50',
        stock_quantity: 5,
        images: ['image2.jpg'],
        category_id: categoryResult[0].id,
        store_id: storeResult[0].id
      })
      .returning()
      .execute();

    const testInput: CreateOrderInput = {
      guest_email: 'customer@test.com',
      guest_name: 'John Doe',
      guest_address: '123 Main St, City, State 12345',
      items: [
        { item_id: itemResult1[0].id, quantity: 2 },
        { item_id: itemResult2[0].id, quantity: 1 }
      ]
    };

    const result = await createOrder(testInput);

    // Verify order fields
    expect(result.guest_email).toEqual('customer@test.com');
    expect(result.guest_name).toEqual('John Doe');
    expect(result.guest_address).toEqual('123 Main St, City, State 12345');
    expect(result.total_amount).toEqual(75.48); // (29.99 * 2) + (15.50 * 1)
    expect(result.status).toEqual('pending');
    expect(result.stripe_payment_intent_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.total_amount).toBe('number');
  });

  it('should save order and order items to database', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: 'Book category'
      })
      .returning()
      .execute();

    const storeResult = await db.insert(storesTable)
      .values({
        name: 'Book Store',
        description: 'A bookstore',
        owner_email: 'bookstore@test.com'
      })
      .returning()
      .execute();

    const itemResult = await db.insert(itemsTable)
      .values({
        name: 'Test Book',
        description: 'A test book',
        price: '12.99',
        stock_quantity: 20,
        images: ['book.jpg'],
        category_id: categoryResult[0].id,
        store_id: storeResult[0].id
      })
      .returning()
      .execute();

    const testInput: CreateOrderInput = {
      guest_email: 'reader@test.com',
      guest_name: 'Jane Smith',
      guest_address: '456 Oak Ave, Town, State 67890',
      items: [
        { item_id: itemResult[0].id, quantity: 3 }
      ]
    };

    const result = await createOrder(testInput);

    // Verify order was saved
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].guest_email).toEqual('reader@test.com');
    expect(orders[0].guest_name).toEqual('Jane Smith');
    expect(parseFloat(orders[0].total_amount)).toEqual(38.97); // 12.99 * 3

    // Verify order items were saved
    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, result.id))
      .execute();

    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].item_id).toEqual(itemResult[0].id);
    expect(orderItems[0].quantity).toEqual(3);
    expect(parseFloat(orderItems[0].price_at_time)).toEqual(12.99);
  });

  it('should throw error for non-existent item', async () => {
    const testInput: CreateOrderInput = {
      guest_email: 'customer@test.com',
      guest_name: 'John Doe',
      guest_address: '123 Main St, City, State 12345',
      items: [
        { item_id: 999999, quantity: 1 }
      ]
    };

    expect(createOrder(testInput)).rejects.toThrow(/item with id 999999 not found/i);
  });

  it('should calculate total correctly for multiple items', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Gadgets',
        description: 'Tech gadgets'
      })
      .returning()
      .execute();

    const storeResult = await db.insert(storesTable)
      .values({
        name: 'Gadget Store',
        description: 'Tech store',
        owner_email: 'tech@test.com'
      })
      .returning()
      .execute();

    const itemResult1 = await db.insert(itemsTable)
      .values({
        name: 'Widget A',
        description: 'First widget',
        price: '10.00',
        stock_quantity: 100,
        images: ['widget-a.jpg'],
        category_id: categoryResult[0].id,
        store_id: storeResult[0].id
      })
      .returning()
      .execute();

    const itemResult2 = await db.insert(itemsTable)
      .values({
        name: 'Widget B',
        description: 'Second widget',
        price: '25.75',
        stock_quantity: 50,
        images: ['widget-b.jpg'],
        category_id: categoryResult[0].id,
        store_id: storeResult[0].id
      })
      .returning()
      .execute();

    const testInput: CreateOrderInput = {
      guest_email: 'buyer@test.com',
      guest_name: 'Bob Johnson',
      guest_address: '789 Pine St, Village, State 11111',
      items: [
        { item_id: itemResult1[0].id, quantity: 4 }, // 10.00 * 4 = 40.00
        { item_id: itemResult2[0].id, quantity: 2 }  // 25.75 * 2 = 51.50
      ]
    };

    const result = await createOrder(testInput);

    expect(result.total_amount).toEqual(91.50); // 40.00 + 51.50
    expect(typeof result.total_amount).toBe('number');
  });
});
