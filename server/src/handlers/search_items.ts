
import { db } from '../db';
import { itemsTable, categoriesTable, storesTable } from '../db/schema';
import { type SearchItemsInput, type ItemWithRelations } from '../schema';
import { eq, gte, lte, ilike, and, desc, SQL } from 'drizzle-orm';

export const searchItems = async (input: SearchItemsInput): Promise<ItemWithRelations[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (input.query) {
      conditions.push(ilike(itemsTable.name, `%${input.query}%`));
    }

    if (input.category_id !== undefined) {
      conditions.push(eq(itemsTable.category_id, input.category_id));
    }

    if (input.store_id !== undefined) {
      conditions.push(eq(itemsTable.store_id, input.store_id));
    }

    if (input.min_price !== undefined) {
      conditions.push(gte(itemsTable.price, input.min_price.toString()));
    }

    if (input.max_price !== undefined) {
      conditions.push(lte(itemsTable.price, input.max_price.toString()));
    }

    if (input.in_stock_only) {
      conditions.push(gte(itemsTable.stock_quantity, 1));
    }

    // Build the complete query with all clauses at once
    const baseQuery = db.select()
      .from(itemsTable)
      .innerJoin(categoriesTable, eq(itemsTable.category_id, categoriesTable.id))
      .innerJoin(storesTable, eq(itemsTable.store_id, storesTable.id));

    const finalQuery = conditions.length > 0
      ? baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(itemsTable.created_at))
          .limit(input.limit)
          .offset(input.offset)
      : baseQuery
          .orderBy(desc(itemsTable.created_at))
          .limit(input.limit)
          .offset(input.offset);

    const results = await finalQuery.execute();

    // Transform results to match ItemWithRelations schema
    return results.map(result => ({
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
    }));
  } catch (error) {
    console.error('Items search failed:', error);
    throw error;
  }
};
