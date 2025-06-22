
import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type UpdateItemInput, type Item } from '../schema';
import { eq } from 'drizzle-orm';

export const updateItem = async (input: UpdateItemInput): Promise<Item> => {
  try {
    // Build update object only with provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.price !== undefined) {
      updateData.price = input.price.toString(); // Convert number to string for numeric column
    }
    
    if (input.stock_quantity !== undefined) {
      updateData.stock_quantity = input.stock_quantity;
    }
    
    if (input.images !== undefined) {
      updateData.images = input.images;
    }
    
    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
    }
    
    if (input.store_id !== undefined) {
      updateData.store_id = input.store_id;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the item
    const result = await db.update(itemsTable)
      .set(updateData)
      .where(eq(itemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Item with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const item = result[0];
    return {
      ...item,
      price: parseFloat(item.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Item update failed:', error);
    throw error;
  }
};
