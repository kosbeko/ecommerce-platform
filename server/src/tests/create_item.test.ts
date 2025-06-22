
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { itemsTable, categoriesTable, storesTable } from '../db/schema';
import { type CreateItemInput } from '../schema';
import { createItem } from '../handlers/create_item';
import { eq } from 'drizzle-orm';

describe('createItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an item', async () => {
    // Create prerequisite category and store
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values({
        name: 'Test Store',
        description: 'A store for testing',
        owner_email: 'owner@test.com'
      })
      .returning()
      .execute();

    const testInput: CreateItemInput = {
      name: 'Test Item',
      description: 'A test item',
      price: 29.99,
      stock_quantity: 50,
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      category_id: category.id,
      store_id: store.id
    };

    const result = await createItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Item');
    expect(result.description).toEqual('A test item');
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toBe('number');
    expect(result.stock_quantity).toEqual(50);
    expect(result.images).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(result.category_id).toEqual(category.id);
    expect(result.store_id).toEqual(store.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save item to database', async () => {
    // Create prerequisite category and store
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic items'
      })
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values({
        name: 'Tech Store',
        description: 'Technology store',
        owner_email: 'tech@store.com'
      })
      .returning()
      .execute();

    const testInput: CreateItemInput = {
      name: 'Laptop',
      description: 'Gaming laptop',
      price: 999.99,
      stock_quantity: 10,
      images: ['https://example.com/laptop.jpg'],
      category_id: category.id,
      store_id: store.id
    };

    const result = await createItem(testInput);

    // Query using proper drizzle syntax
    const items = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].name).toEqual('Laptop');
    expect(items[0].description).toEqual('Gaming laptop');
    expect(parseFloat(items[0].price)).toEqual(999.99);
    expect(items[0].stock_quantity).toEqual(10);
    expect(items[0].images).toEqual(['https://example.com/laptop.jpg']);
    expect(items[0].category_id).toEqual(category.id);
    expect(items[0].store_id).toEqual(store.id);
    expect(items[0].created_at).toBeInstanceOf(Date);
    expect(items[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle items with null description', async () => {
    // Create prerequisite category and store
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: null
      })
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values({
        name: 'Book Store',
        description: null,
        owner_email: 'books@store.com'
      })
      .returning()
      .execute();

    const testInput: CreateItemInput = {
      name: 'Mystery Novel',
      description: null,
      price: 15.50,
      stock_quantity: 0,
      images: [],
      category_id: category.id,
      store_id: store.id
    };

    const result = await createItem(testInput);

    expect(result.name).toEqual('Mystery Novel');
    expect(result.description).toBeNull();
    expect(result.price).toEqual(15.50);
    expect(result.stock_quantity).toEqual(0);
    expect(result.images).toEqual([]);
    expect(result.category_id).toEqual(category.id);
    expect(result.store_id).toEqual(store.id);
  });

  it('should handle multiple items with same category and store', async () => {
    // Create prerequisite category and store
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Clothing',
        description: 'Apparel items'
      })
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values({
        name: 'Fashion Store',
        description: 'Fashion items',
        owner_email: 'fashion@store.com'
      })
      .returning()
      .execute();

    const testInput1: CreateItemInput = {
      name: 'T-Shirt',
      description: 'Cotton t-shirt',
      price: 19.99,
      stock_quantity: 100,
      images: ['https://example.com/tshirt.jpg'],
      category_id: category.id,
      store_id: store.id
    };

    const testInput2: CreateItemInput = {
      name: 'Jeans',
      description: 'Denim jeans',
      price: 49.99,
      stock_quantity: 50,
      images: ['https://example.com/jeans.jpg'],
      category_id: category.id,
      store_id: store.id
    };

    const result1 = await createItem(testInput1);
    const result2 = await createItem(testInput2);

    // Verify both items were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('T-Shirt');
    expect(result2.name).toEqual('Jeans');
    expect(result1.category_id).toEqual(category.id);
    expect(result2.category_id).toEqual(category.id);
    expect(result1.store_id).toEqual(store.id);
    expect(result2.store_id).toEqual(store.id);

    // Verify both items exist in database
    const items = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.store_id, store.id))
      .execute();

    expect(items).toHaveLength(2);
  });
});
