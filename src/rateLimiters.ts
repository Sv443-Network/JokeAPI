import { RateLimiterMemory } from "rate-limiter-flexible";
import { settings } from "./settings.js";

// TODO: fine tune & implement rate limiters for different tiers

/** Generic rate limiter applied everywhere for coarse rate limiting */
export const genericRateLimit = new RateLimiterMemory({
  points: settings.server.rateLimit.generic.points,
  duration: settings.server.rateLimit.generic.duration,
});
