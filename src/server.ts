import compression from "compression";
import express, { NextFunction, Request, Response } from "express";
import { check as portUsed } from "tcp-port-used";
import helmet from "helmet";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import js2xml from "js2xmlparser";
import cors from "cors";

import { initFuncs as endpointInitFuncs } from "./endpoints";
import { settings } from "./settings";
import { error } from "./error";
import auth from "./auth";
import { JSONCompatible } from "svcorelib";
import { ResponseFormat } from "./types";

export const name = "server";

const app = getApp();

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
        const retryAfter = Math.ceil(rlRes.msBeforeNext / 1000);
        res.setHeader("X-RateLimit-Limit", settings.server.rateLimit.points);
        res.setHeader("X-RateLimit-Remaining", rlRes.remainingPoints);
        res.setHeader("Retry-After", retryAfter);
    };

    const listener = app.listen(settings.server.port, settings.server.hostname, () => {
        app.disable("x-powered-by");

        // rate limiting
        app.use(async (req, res, next) => {
            const format = getFormat(req);
            const { authorization } = req.headers;
            const authToken = authorization?.startsWith("Bearer") ? authorization.substring(7) : authorization;

            res.setHeader("API-Info", `JokeAPI v${settings.info.version} (${settings.info.homepage})`);

            if(authToken && auth.validToken(authToken))
                return next();

            rateLimiter.consume(req.ip)
                .catch((err) => {
                    if(err instanceof RateLimiterRes) {
                        addRateLimitHeaders(res, err);
                        res.set("Retry-After", String(Math.ceil(err.msBeforeNext / 1000)));
                        return respond(res, { message: "You are being rate limited" }, 429, format);
                    }
                    else return respond(res, { message: "Internal error in rate limiting middleware. Please try again later." }, 500, format);
                })
                .then((rlRes) => {
                    if(rlRes instanceof RateLimiterRes)
                        addRateLimitHeaders(res, rlRes);
                })
                .finally(next);
        });

        registerEndpoints();
    });

    listener.on("error", (err) => error("General server error", err, true));
}

function getApp() {
    const app = express();
    [
        cors,
        helmet,
        express.json,
        compression,
    ].forEach(mw => app.use(mw()));

    return app;
}

function registerEndpoints() {
    app.get("/", (_req, res) => {
        // TODO: serve docs through nginx here somehow
        res.send("WIP");
    });

    for(const func of endpointInitFuncs)
        func(app);
}

function getFormat(req: Request): ResponseFormat {
    const fmt = req?.query?.format ? String(req.query.format) as ResponseFormat : undefined;
    return fmt && ["json", "xml"].includes(fmt) ? fmt : "json";
}

function respond(res: Response, data: JSONCompatible, status = 200, format: ResponseFormat = "json") {
    res.status(status);
    return res.send(format === "json" ? data : js2xml.parse("data", data));
}
