import type { Router } from "express";

export function init(router: Router) {
  router.get("/joke/$category", (req, res) => {
    void 0;
  });
}
