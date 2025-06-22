
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type Order } from '../schema';
import { eq } from 'drizzle-orm';

export const getOrder = async (id: number): Promise<Order> => {
  try {
    const results = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .execute();

    if (results.length === 0) {
      throw new Error(`Order with id ${id} not found`);
    }

    const order = results[0];
    
    // Convert numeric fields back to numbers
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Order retrieval failed:', error);
    throw error;
  }
};
