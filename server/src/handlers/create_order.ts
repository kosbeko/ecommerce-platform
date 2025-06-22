
import { db } from '../db';
import { ordersTable, orderItemsTable, itemsTable } from '../db/schema';
import { type CreateOrderInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  try {
    // Verify all items exist and calculate total
    let totalAmount = 0;
    const orderItemsData = [];

    for (const orderItem of input.items) {
      const items = await db.select()
        .from(itemsTable)
        .where(eq(itemsTable.id, orderItem.item_id))
        .execute();

      if (items.length === 0) {
        throw new Error(`Item with id ${orderItem.item_id} not found`);
      }

      const item = items[0];
      const itemPrice = parseFloat(item.price);
      const itemTotal = itemPrice * orderItem.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        item_id: orderItem.item_id,
        quantity: orderItem.quantity,
        price_at_time: itemPrice
      });
    }

    // Create the order
    const orderResult = await db.insert(ordersTable)
      .values({
        guest_email: input.guest_email,
        guest_name: input.guest_name,
        guest_address: input.guest_address,
        total_amount: totalAmount.toString()
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Create order items
    const orderItemsToInsert = orderItemsData.map(item => ({
      order_id: order.id,
      item_id: item.item_id,
      quantity: item.quantity,
      price_at_time: item.price_at_time.toString()
    }));

    await db.insert(orderItemsTable)
      .values(orderItemsToInsert)
      .execute();

    // Return order with numeric conversion
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};
