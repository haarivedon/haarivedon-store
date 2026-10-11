import { initContract } from "@ts-rest/core";
import { errorSchema } from "../schemas/common";
import { adminContract } from "./admin";
import { bookingsContract } from "./bookings";
import { coursesContract } from "./courses";
import { healthContract } from "./health";
import { kundaliContract } from "./kundali";
import { predictionsContract } from "./predictions";
import { productsContract } from "./products";
import { servicesContract } from "./services";
import { siteContentContract } from "./site-content";

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
    kundali: kundaliContract,
    courses: coursesContract,
    siteContent: siteContentContract,
    admin: adminContract,
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
  adminContract,
  bookingsContract,
  coursesContract,
  healthContract,
  kundaliContract,
  predictionsContract,
  productsContract,
  servicesContract,
  siteContentContract,
};
