
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, storesTable, itemsTable } from '../db/schema';
import { getItemsByStore } from '../handlers/get_items_by_store';

describe('getItemsByStore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get items by store with relations', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic items'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test store
    const storeResult = await db.insert(storesTable)
      .values({
        name: 'Tech Store',
        description: 'A store for tech items',
        owner_email: 'owner@techstore.com'
      })
      .returning()
      .execute();
    const store = storeResult[0];

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

    const result = await getItemsByStore(store.id);

    expect(result).toHaveLength(2);
    
    // Check first item
    const laptop = result.find(item => item.name === 'Laptop');
    expect(laptop).toBeDefined();
    expect(laptop!.name).toEqual('Laptop');
    expect(laptop!.description).toEqual('Gaming laptop');
    expect(laptop!.price).toEqual(999.99);
    expect(typeof laptop!.price).toBe('number');
    expect(laptop!.stock_quantity).toEqual(5);
    expect(laptop!.images).toEqual(['laptop1.jpg', 'laptop2.jpg']);
    expect(laptop!.category_id).toEqual(category.id);
    expect(laptop!.store_id).toEqual(store.id);
    expect(laptop!.created_at).toBeInstanceOf(Date);
    expect(laptop!.updated_at).toBeInstanceOf(Date);

    // Check category relation
    expect(laptop!.category.id).toEqual(category.id);
    expect(laptop!.category.name).toEqual('Electronics');
    expect(laptop!.category.description).toEqual('Electronic items');
    expect(laptop!.category.created_at).toBeInstanceOf(Date);

    // Check store relation
    expect(laptop!.store.id).toEqual(store.id);
    expect(laptop!.store.name).toEqual('Tech Store');
    expect(laptop!.store.description).toEqual('A store for tech items');
    expect(laptop!.store.owner_email).toEqual('owner@techstore.com');
    expect(laptop!.store.created_at).toBeInstanceOf(Date);

    // Check second item
    const mouse = result.find(item => item.name === 'Mouse');
    expect(mouse).toBeDefined();
    expect(mouse!.name).toEqual('Mouse');
    expect(mouse!.price).toEqual(29.99);
    expect(typeof mouse!.price).toBe('number');
    expect(mouse!.stock_quantity).toEqual(20);
  });

  it('should return empty array for non-existent store', async () => {
    const result = await getItemsByStore(999);
    expect(result).toEqual([]);
  });

  it('should return empty array for store with no items', async () => {
    // Create store but no items
    const storeResult = await db.insert(storesTable)
      .values({
        name: 'Empty Store',
        description: 'Store with no items',
        owner_email: 'empty@store.com'
      })
      .returning()
      .execute();
    const store = storeResult[0];

    const result = await getItemsByStore(store.id);
    expect(result).toEqual([]);
  });
});
