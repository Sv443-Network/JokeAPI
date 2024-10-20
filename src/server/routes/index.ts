import * as joke from "./joke.js";
import * as submission from "./submission.js";
import * as user from "./user.js";

import type { Router } from "express";

export const initFuncs: ((router: Router) => void)[] = [
  joke,
  submission,
  user,
].map(v => v.init);
