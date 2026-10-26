/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as emails from "../emails.js";
import type * as lib_confirmationEmail from "../lib/confirmationEmail.js";
import type * as lib_schedule from "../lib/schedule.js";
import type * as registrations from "../registrations.js";
import type * as seasonReset from "../seasonReset.js";
import type * as settings from "../settings.js";
import type * as tasks from "../tasks.js";
import type * as test from "../test.js";
import type * as timeSlots from "../timeSlots.js";
import type * as venues from "../venues.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  emails: typeof emails;
  "lib/confirmationEmail": typeof lib_confirmationEmail;
  "lib/schedule": typeof lib_schedule;
  registrations: typeof registrations;
  seasonReset: typeof seasonReset;
  settings: typeof settings;
  tasks: typeof tasks;
  test: typeof test;
  timeSlots: typeof timeSlots;
  venues: typeof venues;
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
