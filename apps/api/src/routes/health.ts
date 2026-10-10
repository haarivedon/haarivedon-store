import { contract } from "@repo/contract";
import { tsr } from "@ts-rest/serverless/fetch";

export const healthRouter = tsr.router(contract.health, {
  check: async () => ({
    status: 200 as const,
    body: {
      status: "ok" as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  }),
});
