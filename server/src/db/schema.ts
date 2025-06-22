
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const orderStatusEnum = pgEnum('order_status', [
  'pending', 
  'paid', 
  'shipped', 
  'delivered', 
  'cancelled'
]);

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Stores table
export const storesTable = pgTable('stores', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  owner_email: text('owner_email').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Items table
export const itemsTable = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock_quantity: integer('stock_quantity').notNull(),
  images: json('images').$type<string[]>().notNull().default([]),
  category_id: integer('category_id').notNull(),
  store_id: integer('store_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Orders table
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  guest_email: text('guest_email').notNull(),
  guest_name: text('guest_name').notNull(),
  guest_address: text('guest_address').notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  stripe_payment_intent_id: text('stripe_payment_intent_id'),
  status: orderStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Order items table
export const orderItemsTable = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull(),
  item_id: integer('item_id').notNull(),
  quantity: integer('quantity').notNull(),
  price_at_time: numeric('price_at_time', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  items: many(itemsTable),
}));

export const storesRelations = relations(storesTable, ({ many }) => ({
  items: many(itemsTable),
}));

export const itemsRelations = relations(itemsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [itemsTable.category_id],
    references: [categoriesTable.id],
  }),
  store: one(storesTable, {
    fields: [itemsTable.store_id],
    references: [storesTable.id],
  }),
  orderItems: many(orderItemsTable),
}));

export const ordersRelations = relations(ordersTable, ({ many }) => ({
  orderItems: many(orderItemsTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.order_id],
    references: [ordersTable.id],
  }),
  item: one(itemsTable, {
    fields: [orderItemsTable.item_id],
    references: [itemsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type Store = typeof storesTable.$inferSelect;
export type NewStore = typeof storesTable.$inferInsert;

export type Item = typeof itemsTable.$inferSelect;
export type NewItem = typeof itemsTable.$inferInsert;

export type Order = typeof ordersTable.$inferSelect;
export type NewOrder = typeof ordersTable.$inferInsert;

export type OrderItem = typeof orderItemsTable.$inferSelect;
export type NewOrderItem = typeof orderItemsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  categories: categoriesTable,
  stores: storesTable,
  items: itemsTable,
  orders: ordersTable,
  orderItems: orderItemsTable,
};
