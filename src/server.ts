import compression from "compression";
import express, { NextFunction, Request, Response } from "express";
import { check as portUsed } from "tcp-port-used";
import helmet from "helmet";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import js2xml from "js2xmlparser";
import cors from "cors";
import { getClientIp } from "request-ip";

import { initFuncs as routeInitFuncs } from "./routes";
import { settings } from "./settings";
import { error } from "./error";
import { validToken } from "./auth";
import { JSONCompatible } from "svcorelib";
import { ResponseFormat } from "./types";
import { createHash } from "crypto";

export const name = "server";

const app = createApp();

// TODO: fine tune & implement rate limiters for different tiers
const rateLimiter = new RateLimiterMemory({
  points: settings.server.rateLimit.points,
  duration: settings.server.rateLimit.duration,
});

export async function init() {
  if(await portUsed(settings.server.port))
    throw new Error(`TCP port ${settings.server.port} is already used`);

  // on error
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    const format = getFormat(req);
    if(typeof err === "string" || err instanceof Error)
      return respond(res, `General error in HTTP server: ${err.toString()}`, 500, format);
    else
      return next();
  });

  const addRateLimitHeaders = (res: Response, rlRes: RateLimiterRes) => {
    res.setHeader("X-RateLimit-Limit", settings.server.rateLimit.points);
    res.setHeader("X-RateLimit-Remaining", rlRes.remainingPoints);
    res.setHeader("Retry-After", Math.ceil(rlRes.msBeforeNext / 1000));
  };

  const listener = app.listen(settings.server.port, settings.server.hostname, () => {
    app.disable("x-powered-by");

    // rate limiting
    app.use(async (req, res, next) => {
      const format = getFormat(req);
      const { authorization } = req.headers;
      const authToken = authorization?.startsWith("Bearer") ? authorization.substring(7) : authorization;

      res.setHeader("API-Info", `${settings.info.name} v${settings.info.version} (${settings.info.homepage})`);

      if(authToken && validToken(authToken))
        return next();

      const clientIp = getClientIp(req);
      const ip = clientIp ? hashIp(clientIp) : null;

      if(ip) {
        rateLimiter.consume(ip)
          .catch((err) => {
            if(err instanceof RateLimiterRes) {
              addRateLimitHeaders(res, err);
              return respond(res, { message: "You are being rate limited" }, 429, format);
            }
            else
              return respond(res, { message: "Internal error in rate limiting middleware. Please try again later." }, 500, format);
          })
          .then((rlRes) => {
            if(rlRes instanceof RateLimiterRes)
              addRateLimitHeaders(res, rlRes);
          })
          .finally(next);
      }
      else
        return next();
    });

    registerEndpoints();
  });

  listener.on("error", (err) => error("General server error", err, true));
}

/** Creates the express app */
function createApp() {
  const app = express();
  [
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: "*",
    }),
    helmet({
      referrerPolicy: {
        policy: "no-referrer",
      },
    }),
    express.json(),
    compression(),
  ].forEach(mw => app.use(mw));

  return app;
}

/** Registers all endpoints */
function registerEndpoints() {
  const router = express.Router();

  router.get("/", (_req, res) => {
    // TODO: Redirect to docs
    // or even better, serve them with nginx
    res.send("WIP");
  });

  for(const initRoute of routeInitFuncs)
    initRoute(router);

  app.use(router);
}

/** Gets the response format from the given request */
function getFormat(req: Request): ResponseFormat {
  const fmt = req?.query?.format ? String(req.query.format) as ResponseFormat : undefined;
  return fmt && ["json", "xml"].includes(fmt) ? fmt : "json";
}

/** Responds to a request with the given data and status, converting it to XML if needed */
function respond(res: Response, data: JSONCompatible, status = 200, format: ResponseFormat = "json") {
  res.status(status);
  return res.send(format === "json" ? data : js2xml.parse("data", data));
}

/** Hashes an IP for enhanced privacy */
function hashIp(ip: string) {
  const hash = createHash("sha1", { encoding: "utf-8" });
  hash.update(ip);
  return hash.digest("hex");
}
