
import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Store schema
export const storeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  owner_email: z.string().email(),
  created_at: z.coerce.date()
});

export type Store = z.infer<typeof storeSchema>;

// Item schema
export const itemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  stock_quantity: z.number().int(),
  images: z.array(z.string()),
  category_id: z.number(),
  store_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Item = z.infer<typeof itemSchema>;

// Item with relations
export const itemWithRelationsSchema = itemSchema.extend({
  category: categorySchema,
  store: storeSchema
});

export type ItemWithRelations = z.infer<typeof itemWithRelationsSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  guest_email: z.string().email(),
  guest_name: z.string(),
  guest_address: z.string(),
  total_amount: z.number(),
  stripe_payment_intent_id: z.string().nullable(),
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

// Order item schema
export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  item_id: z.number(),
  quantity: z.number().int(),
  price_at_time: z.number(),
  created_at: z.coerce.date()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Input schemas for creating
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const createStoreInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  owner_email: z.string().email()
});

export type CreateStoreInput = z.infer<typeof createStoreInputSchema>;

export const createItemInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative(),
  images: z.array(z.string().url()),
  category_id: z.number(),
  store_id: z.number()
});

export type CreateItemInput = z.infer<typeof createItemInputSchema>;

export const createOrderInputSchema = z.object({
  guest_email: z.string().email(),
  guest_name: z.string().min(1),
  guest_address: z.string().min(1),
  items: z.array(z.object({
    item_id: z.number(),
    quantity: z.number().int().positive()
  }))
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

// Update schemas
export const updateItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  images: z.array(z.string().url()).optional(),
  category_id: z.number().optional(),
  store_id: z.number().optional()
});

export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;

export const updateOrderStatusInputSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
  stripe_payment_intent_id: z.string().optional()
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;

// Search and filter schemas
export const searchItemsInputSchema = z.object({
  query: z.string().optional(),
  category_id: z.number().optional(),
  store_id: z.number().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  in_stock_only: z.boolean().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0)
});

export type SearchItemsInput = z.infer<typeof searchItemsInputSchema>;

// Payment intent schema
export const createPaymentIntentInputSchema = z.object({
  order_id: z.number()
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentInputSchema>;

export const paymentIntentResponseSchema = z.object({
  client_secret: z.string(),
  payment_intent_id: z.string()
});

export type PaymentIntentResponse = z.infer<typeof paymentIntentResponseSchema>;
