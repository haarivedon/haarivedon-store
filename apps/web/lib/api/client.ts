import { contract } from "@repo/contract";
import { initClient } from "@ts-rest/core";

/**
 * Typed HTTP client generated from the shared contract.
 *
 * Works in Server and Client Components. Every path, body, query and response
 * is checked against @repo/contract at compile time.
 */
export const api = initClient(contract, {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  baseHeaders: {},
  throwOnUnknownStatus: false,
});

export type Api = typeof api;
