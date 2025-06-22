
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCategoryInputSchema,
  createStoreInputSchema,
  createItemInputSchema,
  updateItemInputSchema,
  searchItemsInputSchema,
  createOrderInputSchema,
  updateOrderStatusInputSchema,
  createPaymentIntentInputSchema
} from './schema';

// Import handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { createStore } from './handlers/create_store';
import { getStores } from './handlers/get_stores';
import { createItem } from './handlers/create_item';
import { updateItem } from './handlers/update_item';
import { getItem } from './handlers/get_item';
import { searchItems } from './handlers/search_items';
import { getItemsByCategory } from './handlers/get_items_by_category';
import { getItemsByStore } from './handlers/get_items_by_store';
import { createOrder } from './handlers/create_order';
import { getOrder } from './handlers/get_order';
import { updateOrderStatus } from './handlers/update_order_status';
import { createPaymentIntent } from './handlers/create_payment_intent';
import { getAllOrders } from './handlers/get_all_orders';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Category routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  getCategories: publicProcedure
    .query(() => getCategories()),

  // Store routes
  createStore: publicProcedure
    .input(createStoreInputSchema)
    .mutation(({ input }) => createStore(input)),
  getStores: publicProcedure
    .query(() => getStores()),

  // Item routes
  createItem: publicProcedure
    .input(createItemInputSchema)
    .mutation(({ input }) => createItem(input)),
  updateItem: publicProcedure
    .input(updateItemInputSchema)
    .mutation(({ input }) => updateItem(input)),
  getItem: publicProcedure
    .input(z.number())
    .query(({ input }) => getItem(input)),
  searchItems: publicProcedure
    .input(searchItemsInputSchema)
    .query(({ input }) => searchItems(input)),
  getItemsByCategory: publicProcedure
    .input(z.number())
    .query(({ input }) => getItemsByCategory(input)),
  getItemsByStore: publicProcedure
    .input(z.number())
    .query(({ input }) => getItemsByStore(input)),

  // Order routes
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),
  getOrder: publicProcedure
    .input(z.number())
    .query(({ input }) => getOrder(input)),
  updateOrderStatus: publicProcedure
    .input(updateOrderStatusInputSchema)
    .mutation(({ input }) => updateOrderStatus(input)),
  getAllOrders: publicProcedure
    .query(() => getAllOrders()),

  // Payment routes
  createPaymentIntent: publicProcedure
    .input(createPaymentIntentInputSchema)
    .mutation(({ input }) => createPaymentIntent(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
