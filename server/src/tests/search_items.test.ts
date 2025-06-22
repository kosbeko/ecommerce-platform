
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, storesTable, itemsTable } from '../db/schema';
import { type SearchItemsInput } from '../schema';
import { searchItems } from '../handlers/search_items';

// Test data setup
const testCategory = {
  name: 'Electronics',
  description: 'Electronic devices and accessories'
};

const testStore = {
  name: 'Tech Store',
  description: 'Best tech products',
  owner_email: 'owner@techstore.com'
};

const createTestItem = (name: string, price: number, categoryId: number, storeId: number) => ({
  name,
  description: `Description for ${name}`,
  price: price.toString(),
  stock_quantity: 10,
  images: ['https://example.com/image.jpg'],
  category_id: categoryId,
  store_id: storeId
});

describe('searchItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items with relations', async () => {
    // Create category and store
    const [category] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values(testStore)
      .returning()
      .execute();

    // Create test item
    await db.insert(itemsTable)
      .values(createTestItem('Smartphone', 599.99, category.id, store.id))
      .execute();

    const input: SearchItemsInput = {
      limit: 20,
      offset: 0
    };

    const results = await searchItems(input);

    expect(results).toHaveLength(1);
    const item = results[0];
    
    // Validate item fields
    expect(item.name).toEqual('Smartphone');
    expect(item.price).toEqual(599.99);
    expect(typeof item.price).toEqual('number');
    expect(item.stock_quantity).toEqual(10);
    expect(item.images).toEqual(['https://example.com/image.jpg']);
    
    // Validate category relation
    expect(item.category.name).toEqual('Electronics');
    expect(item.category.description).toEqual('Electronic devices and accessories');
    
    // Validate store relation
    expect(item.store.name).toEqual('Tech Store');
    expect(item.store.owner_email).toEqual('owner@techstore.com');
  });

  it('should filter by query text', async () => {
    // Create category and store
    const [category] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values(testStore)
      .returning()
      .execute();

    // Create multiple items
    await db.insert(itemsTable)
      .values([
        createTestItem('iPhone 15', 999.99, category.id, store.id),
        createTestItem('Samsung Galaxy', 799.99, category.id, store.id),
        createTestItem('Laptop', 1299.99, category.id, store.id)
      ])
      .execute();

    const input: SearchItemsInput = {
      query: 'iPhone',
      limit: 20,
      offset: 0
    };

    const results = await searchItems(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('iPhone 15');
  });

  it('should filter by category_id', async () => {
    // Create categories and store
    const [category1] = await db.insert(categoriesTable)
      .values({ name: 'Electronics', description: null })
      .returning()
      .execute();

    const [category2] = await db.insert(categoriesTable)
      .values({ name: 'Books', description: null })
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values(testStore)
      .returning()
      .execute();

    // Create items in different categories
    await db.insert(itemsTable)
      .values([
        createTestItem('Phone', 599.99, category1.id, store.id),
        createTestItem('Novel', 19.99, category2.id, store.id)
      ])
      .execute();

    const input: SearchItemsInput = {
      category_id: category1.id,
      limit: 20,
      offset: 0
    };

    const results = await searchItems(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Phone');
    expect(results[0].category.name).toEqual('Electronics');
  });

  it('should filter by price range', async () => {
    // Create category and store
    const [category] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values(testStore)
      .returning()
      .execute();

    // Create items with different prices
    await db.insert(itemsTable)
      .values([
        createTestItem('Cheap Item', 10.00, category.id, store.id),
        createTestItem('Mid Item', 50.00, category.id, store.id),
        createTestItem('Expensive Item', 200.00, category.id, store.id)
      ])
      .execute();

    const input: SearchItemsInput = {
      min_price: 25.00,
      max_price: 100.00,
      limit: 20,
      offset: 0
    };

    const results = await searchItems(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Mid Item');
    expect(results[0].price).toEqual(50.00);
  });

  it('should filter by in_stock_only', async () => {
    // Create category and store
    const [category] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values(testStore)
      .returning()
      .execute();

    // Create items with different stock levels
    await db.insert(itemsTable)
      .values([
        { ...createTestItem('In Stock Item', 50.00, category.id, store.id), stock_quantity: 5 },
        { ...createTestItem('Out of Stock Item', 60.00, category.id, store.id), stock_quantity: 0 }
      ])
      .execute();

    const input: SearchItemsInput = {
      in_stock_only: true,
      limit: 20,
      offset: 0
    };

    const results = await searchItems(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('In Stock Item');
    expect(results[0].stock_quantity).toEqual(5);
  });

  it('should handle pagination correctly', async () => {
    // Create category and store
    const [category] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values(testStore)
      .returning()
      .execute();

    // Create multiple items
    const items = Array.from({ length: 25 }, (_, i) => 
      createTestItem(`Item ${i + 1}`, 10.00 + i, category.id, store.id)
    );
    
    await db.insert(itemsTable)
      .values(items)
      .execute();

    // Test first page
    const firstPage: SearchItemsInput = {
      limit: 10,
      offset: 0
    };

    const firstResults = await searchItems(firstPage);
    expect(firstResults).toHaveLength(10);

    // Test second page
    const secondPage: SearchItemsInput = {
      limit: 10,
      offset: 10
    };

    const secondResults = await searchItems(secondPage);
    expect(secondResults).toHaveLength(10);

    // Ensure different results
    expect(firstResults[0].name).not.toEqual(secondResults[0].name);
  });

  it('should combine multiple filters', async () => {
    // Create categories and stores
    const [category1] = await db.insert(categoriesTable)
      .values({ name: 'Electronics', description: null })
      .returning()
      .execute();

    const [category2] = await db.insert(categoriesTable)
      .values({ name: 'Books', description: null })
      .returning()
      .execute();

    const [store] = await db.insert(storesTable)
      .values(testStore)
      .returning()
      .execute();

    // Create items with various attributes
    await db.insert(itemsTable)
      .values([
        createTestItem('Gaming Phone', 599.99, category1.id, store.id), // Should match
        createTestItem('Business Phone', 399.99, category1.id, store.id), // Price too low
        createTestItem('Gaming Book', 699.99, category2.id, store.id), // Wrong category
        createTestItem('Gaming Laptop', 1299.99, category1.id, store.id) // Price too high
      ])
      .execute();

    const input: SearchItemsInput = {
      query: 'Gaming',
      category_id: category1.id,
      min_price: 500.00,
      max_price: 800.00,
      limit: 20,
      offset: 0
    };

    const results = await searchItems(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Gaming Phone');
    expect(results[0].category.name).toEqual('Electronics');
    expect(results[0].price).toEqual(599.99);
  });
});
