/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as emails from "../emails.js";
import type * as registrations from "../registrations.js";
import type * as settings from "../settings.js";
import type * as tasks from "../tasks.js";
import type * as test from "../test.js";
import type * as timeSlots from "../timeSlots.js";
import type * as venues from "../venues.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  emails: typeof emails;
  registrations: typeof registrations;
  settings: typeof settings;
  tasks: typeof tasks;
  test: typeof test;
  timeSlots: typeof timeSlots;
  venues: typeof venues;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
