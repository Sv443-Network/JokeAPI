import type { Application } from "express";

export function init(app: Application) {
    app.get("/joke/$category", (req, res) => {
        void 0;
    });
}
