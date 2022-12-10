import k from "kleur";

import * as lists from "./lists";
import * as server from "./server";
import * as meter from "./meter";

import { settings } from "./settings";

type Module = {
    init: () => Promise<unknown>,
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
        server,
        meter,
    ];

    for(const mod of modules) {
        try {
            await mod.init();
            console.info(`Initialized module "${mod.name}"`);
        }
        catch(err) {
            console.error(k.red(`Error while initializing module "${mod.name}":\n`), err);
        }
    }
}

init();
