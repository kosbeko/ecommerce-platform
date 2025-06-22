
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storesTable } from '../db/schema';
import { type CreateStoreInput } from '../schema';
import { createStore } from '../handlers/create_store';
import { eq } from 'drizzle-orm';

const testInput: CreateStoreInput = {
  name: 'Test Store',
  description: 'A store for testing',
  owner_email: 'owner@example.com'
};

describe('createStore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a store', async () => {
    const result = await createStore(testInput);

    expect(result.name).toEqual('Test Store');
    expect(result.description).toEqual('A store for testing');
    expect(result.owner_email).toEqual('owner@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save store to database', async () => {
    const result = await createStore(testInput);

    const stores = await db.select()
      .from(storesTable)
      .where(eq(storesTable.id, result.id))
      .execute();

    expect(stores).toHaveLength(1);
    expect(stores[0].name).toEqual('Test Store');
    expect(stores[0].description).toEqual('A store for testing');
    expect(stores[0].owner_email).toEqual('owner@example.com');
    expect(stores[0].created_at).toBeInstanceOf(Date);
  });

  it('should create store with null description', async () => {
    const inputWithNullDescription: CreateStoreInput = {
      name: 'Store Without Description',
      description: null,
      owner_email: 'owner2@example.com'
    };

    const result = await createStore(inputWithNullDescription);

    expect(result.name).toEqual('Store Without Description');
    expect(result.description).toBeNull();
    expect(result.owner_email).toEqual('owner2@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
