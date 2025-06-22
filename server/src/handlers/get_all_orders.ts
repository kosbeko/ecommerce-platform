
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type Order } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    // Get all orders ordered by creation date (newest first)
    const results = await db.select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.created_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
};
