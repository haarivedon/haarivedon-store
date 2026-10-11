import { contract } from "@repo/contract";
import { tsr } from "@ts-rest/serverless/fetch";
import { bookingsRouter } from "./routes/bookings";
import { healthRouter } from "./routes/health";
import { predictionsRouter } from "./routes/predictions";
import { productsRouter } from "./routes/products";
import { servicesRouter } from "./routes/services";

/** Implementation of every route declared in @repo/contract. */
export const router = tsr.router(contract, {
  health: healthRouter,
  bookings: bookingsRouter,
  predictions: predictionsRouter,
  services: servicesRouter,
  products: productsRouter,
});
