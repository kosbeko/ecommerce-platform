
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, storesTable, itemsTable } from '../db/schema';
import { type UpdateItemInput } from '../schema';
import { updateItem } from '../handlers/update_item';
import { eq } from 'drizzle-orm';

describe('updateItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let storeId: number;
  let itemId: number;

  // Setup prerequisite data
  beforeEach(async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create store
    const storeResult = await db.insert(storesTable)
      .values({
        name: 'Tech Store',
        description: 'A store for tech items',
        owner_email: 'owner@techstore.com'
      })
      .returning()
      .execute();
    storeId = storeResult[0].id;

    // Create item to update
    const itemResult = await db.insert(itemsTable)
      .values({
        name: 'Original Item',
        description: 'Original description',
        price: '99.99',
        stock_quantity: 50,
        images: ['image1.jpg'],
        category_id: categoryId,
        store_id: storeId
      })
      .returning()
      .execute();
    itemId = itemResult[0].id;
  });

  it('should update item name', async () => {
    const input: UpdateItemInput = {
      id: itemId,
      name: 'Updated Item Name'
    };

    const result = await updateItem(input);

    expect(result.id).toEqual(itemId);
    expect(result.name).toEqual('Updated Item Name');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.price).toEqual(99.99);
    expect(result.stock_quantity).toEqual(50);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const input: UpdateItemInput = {
      id: itemId,
      name: 'Completely Updated Item',
      description: 'New description',
      price: 149.99,
      stock_quantity: 25,
      images: ['new1.jpg', 'new2.jpg']
    };

    const result = await updateItem(input);

    expect(result.id).toEqual(itemId);
    expect(result.name).toEqual('Completely Updated Item');
    expect(result.description).toEqual('New description');
    expect(result.price).toEqual(149.99);
    expect(typeof result.price).toEqual('number');
    expect(result.stock_quantity).toEqual(25);
    expect(result.images).toEqual(['new1.jpg', 'new2.jpg']);
    expect(result.category_id).toEqual(categoryId); // Should remain unchanged
    expect(result.store_id).toEqual(storeId); // Should remain unchanged
  });

  it('should update category and store references', async () => {
    // Create another category and store
    const newCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: 'Book category'
      })
      .returning()
      .execute();
    const newCategoryId = newCategoryResult[0].id;

    const newStoreResult = await db.insert(storesTable)
      .values({
        name: 'Book Store',
        description: 'A store for books',
        owner_email: 'owner@bookstore.com'
      })
      .returning()
      .execute();
    const newStoreId = newStoreResult[0].id;

    const input: UpdateItemInput = {
      id: itemId,
      category_id: newCategoryId,
      store_id: newStoreId
    };

    const result = await updateItem(input);

    expect(result.id).toEqual(itemId);
    expect(result.category_id).toEqual(newCategoryId);
    expect(result.store_id).toEqual(newStoreId);
    expect(result.name).toEqual('Original Item'); // Should remain unchanged
  });

  it('should update item in database', async () => {
    const input: UpdateItemInput = {
      id: itemId,
      name: 'Database Updated Item',
      price: 199.99
    };

    await updateItem(input);

    // Verify in database
    const items = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, itemId))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Database Updated Item');
    expect(parseFloat(items[0].price)).toEqual(199.99);
    expect(items[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description update', async () => {
    const input: UpdateItemInput = {
      id: itemId,
      description: null
    };

    const result = await updateItem(input);

    expect(result.id).toEqual(itemId);
    expect(result.description).toBeNull();
    expect(result.name).toEqual('Original Item'); // Should remain unchanged
  });

  it('should throw error for non-existent item', async () => {
    const input: UpdateItemInput = {
      id: 99999,
      name: 'This should fail'
    };

    expect(updateItem(input)).rejects.toThrow(/not found/i);
  });

  it('should update stock quantity to zero', async () => {
    const input: UpdateItemInput = {
      id: itemId,
      stock_quantity: 0
    };

    const result = await updateItem(input);

    expect(result.id).toEqual(itemId);
    expect(result.stock_quantity).toEqual(0);
    expect(result.name).toEqual('Original Item'); // Should remain unchanged
  });
});
