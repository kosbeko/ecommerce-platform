
import { db } from '../db';
import { itemsTable, categoriesTable, storesTable } from '../db/schema';
import { type ItemWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const getItemsByCategory = async (categoryId: number): Promise<ItemWithRelations[]> => {
  try {
    // Query items with their category and store relations
    const results = await db.select()
      .from(itemsTable)
      .innerJoin(categoriesTable, eq(itemsTable.category_id, categoriesTable.id))
      .innerJoin(storesTable, eq(itemsTable.store_id, storesTable.id))
      .where(eq(itemsTable.category_id, categoryId))
      .execute();

    // Transform joined results into ItemWithRelations format
    return results.map(result => ({
      // Item fields with numeric conversions
      id: result.items.id,
      name: result.items.name,
      description: result.items.description,
      price: parseFloat(result.items.price), // Convert numeric to number
      stock_quantity: result.items.stock_quantity,
      images: result.items.images,
      category_id: result.items.category_id,
      store_id: result.items.store_id,
      created_at: result.items.created_at,
      updated_at: result.items.updated_at,
      // Related category
      category: {
        id: result.categories.id,
        name: result.categories.name,
        description: result.categories.description,
        created_at: result.categories.created_at
      },
      // Related store
      store: {
        id: result.stores.id,
        name: result.stores.name,
        description: result.stores.description,
        owner_email: result.stores.owner_email,
        created_at: result.stores.created_at
      }
    }));
  } catch (error) {
    console.error('Failed to get items by category:', error);
    throw error;
  }
};
