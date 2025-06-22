
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { getAllOrders } from '../handlers/get_all_orders';
import { type Order } from '../schema';

describe('getAllOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no orders exist', async () => {
    const result = await getAllOrders();

    expect(result).toEqual([]);
  });

  it('should return all orders', async () => {
    // Create test orders
    const testOrders = [
      {
        guest_email: 'test1@example.com',
        guest_name: 'Test User 1',
        guest_address: '123 Test St',
        total_amount: '29.99',
        status: 'pending' as const
      },
      {
        guest_email: 'test2@example.com',
        guest_name: 'Test User 2',
        guest_address: '456 Test Ave',
        total_amount: '49.99',
        status: 'paid' as const
      }
    ];

    await db.insert(ordersTable).values(testOrders).execute();

    const result = await getAllOrders();

    expect(result).toHaveLength(2);
    
    // Check that numeric conversion is working
    result.forEach(order => {
      expect(typeof order.total_amount).toBe('number');
      expect(order.id).toBeDefined();
      expect(order.created_at).toBeInstanceOf(Date);
      expect(order.updated_at).toBeInstanceOf(Date);
    });

    // Check specific order data
    const order1 = result.find(o => o.guest_email === 'test1@example.com');
    const order2 = result.find(o => o.guest_email === 'test2@example.com');

    expect(order1).toBeDefined();
    expect(order1?.guest_name).toBe('Test User 1');
    expect(order1?.total_amount).toBe(29.99);
    expect(order1?.status).toBe('pending');

    expect(order2).toBeDefined();
    expect(order2?.guest_name).toBe('Test User 2');
    expect(order2?.total_amount).toBe(49.99);
    expect(order2?.status).toBe('paid');
  });

  it('should return orders ordered by creation date (newest first)', async () => {
    // Create first order
    const firstOrder = await db.insert(ordersTable).values({
      guest_email: 'first@example.com',
      guest_name: 'First User',
      guest_address: '123 First St',
      total_amount: '10.00',
      status: 'pending'
    }).returning().execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second order
    const secondOrder = await db.insert(ordersTable).values({
      guest_email: 'second@example.com',
      guest_name: 'Second User',
      guest_address: '456 Second St',
      total_amount: '20.00',
      status: 'paid'
    }).returning().execute();

    const result = await getAllOrders();

    expect(result).toHaveLength(2);
    
    // Newest order should be first
    expect(result[0].guest_email).toBe('second@example.com');
    expect(result[1].guest_email).toBe('first@example.com');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle different order statuses', async () => {
    const testOrders = [
      {
        guest_email: 'pending@example.com',
        guest_name: 'Pending User',
        guest_address: '123 Pending St',
        total_amount: '15.00',
        status: 'pending' as const
      },
      {
        guest_email: 'paid@example.com',
        guest_name: 'Paid User',
        guest_address: '456 Paid Ave',
        total_amount: '25.00',
        status: 'paid' as const
      },
      {
        guest_email: 'shipped@example.com',
        guest_name: 'Shipped User',
        guest_address: '789 Shipped Blvd',
        total_amount: '35.00',
        status: 'shipped' as const
      },
      {
        guest_email: 'delivered@example.com',
        guest_name: 'Delivered User',
        guest_address: '101 Delivered Dr',
        total_amount: '45.00',
        status: 'delivered' as const
      },
      {
        guest_email: 'cancelled@example.com',
        guest_name: 'Cancelled User',
        guest_address: '202 Cancelled Ct',
        total_amount: '55.00',
        status: 'cancelled' as const
      }
    ];

    await db.insert(ordersTable).values(testOrders).execute();

    const result = await getAllOrders();

    expect(result).toHaveLength(5);

    const statuses = result.map(order => order.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('paid');
    expect(statuses).toContain('shipped');
    expect(statuses).toContain('delivered');
    expect(statuses).toContain('cancelled');
  });
});
