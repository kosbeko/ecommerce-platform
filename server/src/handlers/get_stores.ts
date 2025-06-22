
import { db } from '../db';
import { storesTable } from '../db/schema';
import { type Store } from '../schema';

export const getStores = async (): Promise<Store[]> => {
  try {
    const results = await db.select()
      .from(storesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Get stores failed:', error);
    throw error;
  }
};
