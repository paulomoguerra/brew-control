/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cafe from "../cafe.js";
import type * as clients from "../clients.js";
import type * as inventory from "../inventory.js";
import type * as orders from "../orders.js";
import type * as quality from "../quality.js";
import type * as recipes from "../recipes.js";
import type * as roasts from "../roasts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cafe: typeof cafe;
  clients: typeof clients;
  inventory: typeof inventory;
  orders: typeof orders;
  quality: typeof quality;
  recipes: typeof recipes;
  roasts: typeof roasts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
