import k from "kleur";

import * as lists from "./lists.js";
import * as auth from "./auth.js";
import * as server from "./server/index.js";
import * as meter from "./meter.js";

import { settings } from "./settings.js";
import { logInfo } from "./utils.js";

type JAPIModule = {
  init: () => unknown | Promise<unknown>,
  name: string,
};

async function init() {
  await initModules();

  const initMsgLines = [
    k.blue(k.bold(settings.info.name)) + k.gray(` v${settings.info.version}`),
    `  └─► HTTP Port: ${settings.server.port}`,
  ];
  // ├─►
  // └─►
  console.log(`\n${initMsgLines.join("\n")}\n`);
}

/** Initialize JokeAPI's modules */
async function initModules() {
  const modules: JAPIModule[] = [
    lists,
    auth,
    server,
    meter,
  ];

  for(const mod of modules) {
    try {
      const initRes = mod.init();
      if(initRes instanceof Promise)
        await initRes;

      logInfo(`Initialized module "${mod.name}"`);
    }
    catch(err) {
      console.error(k.red(`Error while initializing module "${mod.name}":\n`), err);
    }
  }
}

init();
