
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Electronics',
          description: 'Electronic devices and gadgets'
        },
        {
          name: 'Books',
          description: 'Fiction and non-fiction books'
        },
        {
          name: 'Clothing',
          description: null
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify all categories are returned
    const categoryNames = result.map(cat => cat.name).sort();
    expect(categoryNames).toEqual(['Books', 'Clothing', 'Electronics']);
    
    // Verify structure of first category
    const electronicsCategory = result.find(cat => cat.name === 'Electronics');
    expect(electronicsCategory).toBeDefined();
    expect(electronicsCategory!.description).toEqual('Electronic devices and gadgets');
    expect(electronicsCategory!.id).toBeDefined();
    expect(electronicsCategory!.created_at).toBeInstanceOf(Date);
    
    // Verify null description handling
    const clothingCategory = result.find(cat => cat.name === 'Clothing');
    expect(clothingCategory!.description).toBeNull();
  });

  it('should return categories in database order', async () => {
    // Create categories in specific order
    const insertedCategories = await db.insert(categoriesTable)
      .values([
        { name: 'First Category', description: 'First' },
        { name: 'Second Category', description: 'Second' },
        { name: 'Third Category', description: 'Third' }
      ])
      .returning()
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Should maintain database insertion order (by id)
    expect(result[0].name).toEqual('First Category');
    expect(result[1].name).toEqual('Second Category');
    expect(result[2].name).toEqual('Third Category');
    
    // Verify IDs are in ascending order
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});
