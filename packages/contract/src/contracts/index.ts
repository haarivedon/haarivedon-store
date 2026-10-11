import { initContract } from "@ts-rest/core";
import { errorSchema } from "../schemas/common";
import { bookingsContract } from "./bookings";
import { healthContract } from "./health";
import { predictionsContract } from "./predictions";
import { productsContract } from "./products";
import { servicesContract } from "./services";

const c = initContract();

/**
 * The single source of truth for the HTTP API.
 *
 * Both apps/api (implementation) and apps/web (client) derive their types from
 * this object — adding a route here is the only place a route is declared.
 */
export const contract = c.router(
  {
    health: healthContract,
    bookings: bookingsContract,
    predictions: predictionsContract,
    services: servicesContract,
    products: productsContract,
  },
  {
    pathPrefix: "/api",
    commonResponses: {
      400: errorSchema,
      401: errorSchema,
      500: errorSchema,
    },
  },
);

export type Contract = typeof contract;
export {
  bookingsContract,
  healthContract,
  predictionsContract,
  productsContract,
  servicesContract,
};
