import * as joke from "./joke";
import * as submission from "./submission";
import * as user from "./user";

import type { Router } from "express";

export const initFuncs: ((router: Router) => void)[] = [
  joke,
  submission,
  user,
].map(v => v.init);
