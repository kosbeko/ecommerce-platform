
import { db } from '../db';
import { itemsTable, categoriesTable, storesTable } from '../db/schema';
import { type ItemWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const getItem = async (id: number): Promise<ItemWithRelations> => {
  try {
    const results = await db.select()
      .from(itemsTable)
      .innerJoin(categoriesTable, eq(itemsTable.category_id, categoriesTable.id))
      .innerJoin(storesTable, eq(itemsTable.store_id, storesTable.id))
      .where(eq(itemsTable.id, id))
      .execute();

    if (results.length === 0) {
      throw new Error(`Item with id ${id} not found`);
    }

    const result = results[0];
    
    return {
      id: result.items.id,
      name: result.items.name,
      description: result.items.description,
      price: parseFloat(result.items.price),
      stock_quantity: result.items.stock_quantity,
      images: result.items.images,
      category_id: result.items.category_id,
      store_id: result.items.store_id,
      created_at: result.items.created_at,
      updated_at: result.items.updated_at,
      category: {
        id: result.categories.id,
        name: result.categories.name,
        description: result.categories.description,
        created_at: result.categories.created_at
      },
      store: {
        id: result.stores.id,
        name: result.stores.name,
        description: result.stores.description,
        owner_email: result.stores.owner_email,
        created_at: result.stores.created_at
      }
    };
  } catch (error) {
    console.error('Get item failed:', error);
    throw error;
  }
};
