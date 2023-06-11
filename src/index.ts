import k from "kleur";

import * as lists from "./lists";
import * as auth from "./auth";
import * as server from "./server";
import * as meter from "./meter";

import { settings } from "./settings";

type Module = {
    init: () => unknown | Promise<unknown>,
    name: string,
};

async function init() {
  await initModules();

  console.log("\n");
  console.log(k.blue(settings.info.name) + k.gray(` ${settings.info.version}`));
  console.log(`HTTP Port: ${settings.server.port}`);
  console.log();
}

async function initModules() {
  const modules: Module[] = [
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

      console.info(`Initialized module "${mod.name}"`);
    }
    catch(err) {
      console.error(k.red(`Error while initializing module "${mod.name}":\n`), err);
    }
  }
}

init();
