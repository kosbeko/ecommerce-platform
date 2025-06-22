
import { db } from '../db';
import { storesTable } from '../db/schema';
import { type CreateStoreInput, type Store } from '../schema';

export const createStore = async (input: CreateStoreInput): Promise<Store> => {
  try {
    const result = await db.insert(storesTable)
      .values({
        name: input.name,
        description: input.description,
        owner_email: input.owner_email
      })
      .returning()
      .execute();

    const store = result[0];
    return store;
  } catch (error) {
    console.error('Store creation failed:', error);
    throw error;
  }
};
