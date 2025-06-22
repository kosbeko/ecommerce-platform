
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storesTable } from '../db/schema';
import { getStores } from '../handlers/get_stores';

describe('getStores', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no stores exist', async () => {
    const result = await getStores();
    expect(result).toEqual([]);
  });

  it('should return all stores', async () => {
    // Create test stores
    await db.insert(storesTable).values([
      {
        name: 'Test Store 1',
        description: 'First test store',
        owner_email: 'owner1@example.com'
      },
      {
        name: 'Test Store 2',
        description: null,
        owner_email: 'owner2@example.com'
      }
    ]).execute();

    const result = await getStores();

    expect(result).toHaveLength(2);
    
    // Check first store
    expect(result[0].name).toEqual('Test Store 1');
    expect(result[0].description).toEqual('First test store');
    expect(result[0].owner_email).toEqual('owner1@example.com');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second store
    expect(result[1].name).toEqual('Test Store 2');
    expect(result[1].description).toBeNull();
    expect(result[1].owner_email).toEqual('owner2@example.com');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return stores ordered by creation time', async () => {
    // Create stores with slight delay to ensure different timestamps
    await db.insert(storesTable).values({
      name: 'First Store',
      description: 'Created first',
      owner_email: 'first@example.com'
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(storesTable).values({
      name: 'Second Store',
      description: 'Created second',
      owner_email: 'second@example.com'
    }).execute();

    const result = await getStores();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Store');
    expect(result[1].name).toEqual('Second Store');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
