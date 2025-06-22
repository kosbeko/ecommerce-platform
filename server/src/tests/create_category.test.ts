
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

const testInput: CreateCategoryInput = {
  name: 'Electronics',
  description: 'Electronic devices and accessories'
};

const testInputWithoutDescription: CreateCategoryInput = {
  name: 'Books',
  description: null
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with description', async () => {
    const result = await createCategory(testInput);

    expect(result.name).toEqual('Electronics');
    expect(result.description).toEqual('Electronic devices and accessories');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category without description', async () => {
    const result = await createCategory(testInputWithoutDescription);

    expect(result.name).toEqual('Books');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Electronics');
    expect(categories[0].description).toEqual('Electronic devices and accessories');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple categories', async () => {
    const category1 = await createCategory(testInput);
    const category2 = await createCategory(testInputWithoutDescription);

    expect(category1.id).not.toEqual(category2.id);
    expect(category1.name).toEqual('Electronics');
    expect(category2.name).toEqual('Books');

    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
  });
});
