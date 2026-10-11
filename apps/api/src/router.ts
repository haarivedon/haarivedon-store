import { contract } from "@repo/contract";
import { tsr } from "@ts-rest/serverless/fetch";
import { adminRouter } from "./routes/admin";
import { bookingsRouter } from "./routes/bookings";
import { coursesRouter } from "./routes/courses";
import { enquiriesRouter } from "./routes/enquiries";
import { healthRouter } from "./routes/health";
import { kundaliRouter } from "./routes/kundali";
import { predictionsRouter } from "./routes/predictions";
import { productsRouter } from "./routes/products";
import { servicesRouter } from "./routes/services";
import { siteContentRouter } from "./routes/site-content";

/** Implementation of every route declared in @repo/contract. */
export const router = tsr.router(contract, {
  health: healthRouter,
  bookings: bookingsRouter,
  predictions: predictionsRouter,
  services: servicesRouter,
  products: productsRouter,
  kundali: kundaliRouter,
  courses: coursesRouter,
  enquiries: enquiriesRouter,
  siteContent: siteContentRouter,
  admin: adminRouter,
});
