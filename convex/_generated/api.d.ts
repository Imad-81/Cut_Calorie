/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analyzeFoodAction from "../analyzeFoodAction.js";
import type * as clerk from "../clerk.js";
import type * as dailySummaries from "../dailySummaries.js";
import type * as foodLogs from "../foodLogs.js";
import type * as http from "../http.js";
import type * as imageProcessing from "../imageProcessing.js";
import type * as lib from "../lib.js";
import type * as users from "../users.js";
import type * as weightLogs from "../weightLogs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analyzeFoodAction: typeof analyzeFoodAction;
  clerk: typeof clerk;
  dailySummaries: typeof dailySummaries;
  foodLogs: typeof foodLogs;
  http: typeof http;
  imageProcessing: typeof imageProcessing;
  lib: typeof lib;
  users: typeof users;
  weightLogs: typeof weightLogs;
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
