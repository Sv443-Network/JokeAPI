import * as joke from "./joke";
import * as submission from "./submission";
import * as user from "./user";

export const initFuncs = [
  joke,
  submission,
  user,
].map(v => v.init);
