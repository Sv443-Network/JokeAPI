import type { Application } from "express";

export function init(app: Application) {
    app.get("/submissions", (req, res) => {
        void 0;
    });
}
