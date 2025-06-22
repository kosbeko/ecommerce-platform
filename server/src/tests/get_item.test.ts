
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, storesTable, itemsTable } from '../db/schema';
import { getItem } from '../handlers/get_item';

describe('getItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get an item with relations', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices'
      })
      .returning()
      .execute();

    const storeResult = await db.insert(storesTable)
      .values({
        name: 'Tech Store',
        description: 'Best tech store',
        owner_email: 'owner@techstore.com'
      })
      .returning()
      .execute();

    const itemResult = await db.insert(itemsTable)
      .values({
        name: 'Smartphone',
        description: 'Latest smartphone',
        price: '599.99',
        stock_quantity: 50,
        images: ['https://example.com/phone.jpg'],
        category_id: categoryResult[0].id,
        store_id: storeResult[0].id
      })
      .returning()
      .execute();

    const result = await getItem(itemResult[0].id);

    // Verify item fields
    expect(result.id).toEqual(itemResult[0].id);
    expect(result.name).toEqual('Smartphone');
    expect(result.description).toEqual('Latest smartphone');
    expect(result.price).toEqual(599.99);
    expect(typeof result.price).toBe('number');
    expect(result.stock_quantity).toEqual(50);
    expect(result.images).toEqual(['https://example.com/phone.jpg']);
    expect(result.category_id).toEqual(categoryResult[0].id);
    expect(result.store_id).toEqual(storeResult[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify category relation
    expect(result.category.id).toEqual(categoryResult[0].id);
    expect(result.category.name).toEqual('Electronics');
    expect(result.category.description).toEqual('Electronic devices');
    expect(result.category.created_at).toBeInstanceOf(Date);

    // Verify store relation
    expect(result.store.id).toEqual(storeResult[0].id);
    expect(result.store.name).toEqual('Tech Store');
    expect(result.store.description).toEqual('Best tech store');
    expect(result.store.owner_email).toEqual('owner@techstore.com');
    expect(result.store.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when item not found', async () => {
    await expect(getItem(999)).rejects.toThrow(/item with id 999 not found/i);
  });

  it('should handle items with null descriptions', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: null
      })
      .returning()
      .execute();

    const storeResult = await db.insert(storesTable)
      .values({
        name: 'Book Store',
        description: null,
        owner_email: 'owner@bookstore.com'
      })
      .returning()
      .execute();

    const itemResult = await db.insert(itemsTable)
      .values({
        name: 'Novel',
        description: null,
        price: '15.99',
        stock_quantity: 25,
        images: [],
        category_id: categoryResult[0].id,
        store_id: storeResult[0].id
      })
      .returning()
      .execute();

    const result = await getItem(itemResult[0].id);

    expect(result.description).toBeNull();
    expect(result.category.description).toBeNull();
    expect(result.store.description).toBeNull();
    expect(result.images).toEqual([]);
  });
});
