
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, storesTable, itemsTable } from '../db/schema';
import { getItemsByCategory } from '../handlers/get_items_by_category';

describe('getItemsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items with relations for a given category', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices'
      })
      .returning()
      .execute();

    // Create test store
    const [store] = await db.insert(storesTable)
      .values({
        name: 'Tech Store',
        description: 'Electronics retailer',
        owner_email: 'owner@techstore.com'
      })
      .returning()
      .execute();

    // Create test items
    await db.insert(itemsTable)
      .values([
        {
          name: 'Laptop',
          description: 'Gaming laptop',
          price: '999.99',
          stock_quantity: 5,
          images: ['laptop1.jpg', 'laptop2.jpg'],
          category_id: category.id,
          store_id: store.id
        },
        {
          name: 'Mouse',
          description: 'Wireless mouse',
          price: '29.99',
          stock_quantity: 20,
          images: ['mouse.jpg'],
          category_id: category.id,
          store_id: store.id
        }
      ])
      .execute();

    const results = await getItemsByCategory(category.id);

    expect(results).toHaveLength(2);

    // Check first item
    const laptop = results.find(item => item.name === 'Laptop');
    expect(laptop).toBeDefined();
    expect(laptop!.name).toBe('Laptop');
    expect(laptop!.description).toBe('Gaming laptop');
    expect(laptop!.price).toBe(999.99);
    expect(typeof laptop!.price).toBe('number');
    expect(laptop!.stock_quantity).toBe(5);
    expect(laptop!.images).toEqual(['laptop1.jpg', 'laptop2.jpg']);
    expect(laptop!.category_id).toBe(category.id);
    expect(laptop!.store_id).toBe(store.id);

    // Check category relation
    expect(laptop!.category.id).toBe(category.id);
    expect(laptop!.category.name).toBe('Electronics');
    expect(laptop!.category.description).toBe('Electronic devices');
    expect(laptop!.category.created_at).toBeInstanceOf(Date);

    // Check store relation
    expect(laptop!.store.id).toBe(store.id);
    expect(laptop!.store.name).toBe('Tech Store');
    expect(laptop!.store.description).toBe('Electronics retailer');
    expect(laptop!.store.owner_email).toBe('owner@techstore.com');
    expect(laptop!.store.created_at).toBeInstanceOf(Date);

    // Check second item
    const mouse = results.find(item => item.name === 'Mouse');
    expect(mouse).toBeDefined();
    expect(mouse!.price).toBe(29.99);
    expect(typeof mouse!.price).toBe('number');
    expect(mouse!.stock_quantity).toBe(20);
  });

  it('should return empty array for non-existent category', async () => {
    const results = await getItemsByCategory(999);
    expect(results).toHaveLength(0);
  });

  it('should return empty array for category with no items', async () => {
    // Create category but no items
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Empty Category',
        description: 'Category with no items'
      })
      .returning()
      .execute();

    const results = await getItemsByCategory(category.id);
    expect(results).toHaveLength(0);
  });

  it('should only return items from specified category', async () => {
    // Create two categories
    const [category1] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices'
      })
      .returning()
      .execute();

    const [category2] = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: 'Literature and educational books'
      })
      .returning()
      .execute();

    // Create test store
    const [store] = await db.insert(storesTable)
      .values({
        name: 'General Store',
        description: 'Sells everything',
        owner_email: 'owner@general.com'
      })
      .returning()
      .execute();

    // Create items in different categories
    await db.insert(itemsTable)
      .values([
        {
          name: 'Laptop',
          description: 'Gaming laptop',
          price: '999.99',
          stock_quantity: 5,
          images: ['laptop.jpg'],
          category_id: category1.id,
          store_id: store.id
        },
        {
          name: 'Novel',
          description: 'Fiction book',
          price: '15.99',
          stock_quantity: 10,
          images: ['book.jpg'],
          category_id: category2.id,
          store_id: store.id
        }
      ])
      .execute();

    // Should only return items from category1
    const results = await getItemsByCategory(category1.id);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Laptop');
    expect(results[0].category.name).toBe('Electronics');
  });
});
