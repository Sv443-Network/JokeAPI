import compression from "compression";
import express, { NextFunction, Request, Response } from "express";
import { check as portUsed } from "tcp-port-used";
import helmet from "helmet";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import cors from "cors";

import { settings } from "./settings";

export const name = "server";

const app = express();

app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(express.json());
app.use(compression());

// TODO: fine tune & implement rate limiters for different tiers
const rateLimiter = new RateLimiterMemory({
    points: 300,
    duration: 60 * 30,
});

export async function init() {
    if(await portUsed(settings.server.port))
        throw new Error(`TCP port ${settings.server.port} is already used`);

    // on error
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        if(typeof err === "string" || err instanceof Error)
            return respond(res, "serverError", `General error in HTTP server: ${err.toString()}`, req?.query?.format ? String(req.query.format) : undefined);
        else
            return next();
    });

    const listener = app.listen(settings.server.port, settings.server.hostname, () => {
        app.disable("x-powered-by");

        // rate limiting
        app.use(async (req, res, next) => {
            const { authorization } = req.headers;
            const authToken = authorization?.startsWith("Bearer") ? authorization.substring(7) : authorization;

            res.setHeader("API-Info", `JokeAPI v${settings.info.version} (${settings.info.homepage})`);

            if(authToken && auth.validToken(authToken))
                return next();

            rateLimiter.consume(req.ip)
                .catch((err) => {
                    if(err instanceof RateLimiterRes) {
                        res.set("Retry-After", String(Math.ceil(err.msBeforeNext / 1000)));
                        return respond(res, 429, { message: "You are being rate limited" }, fmt);
                    }
                    else return respond(res, 500, { message: "Internal error in rate limiting middleware. Please try again later." }, fmt);
                })
                .finally(next);
        });

        registerEndpoints();
    });

    listener.on("error", (err) => error("General server error", err, true));
}

function registerEndpoints() {
    app.get("/", (_req, res) => {
        // TODO: serve docs through nginx here somehow
        res.send("WIP");
    });
}
