#!/usr/bin/env node

const yargs = require("yargs");
const importFresh = require("import-fresh");
const { colors, Errors } = require("svcorelib");

const settings = require("../settings");

const { exit } = process;
const col = colors.fg;


const argv = yargs
    .scriptName("jokeapi")
    .version(`JokeAPI v${settings.info.version} - ${settings.info.projGitHub}`)
    .command([ "submissions", "sub", "s" ], "Goes through all submissions, prompting to edit, add or delete them")
    .example("$0 submissions")
    .help()
    .alias("h", "help")
    .completion()
    .argv;


async function run()
{
    const command = argv._[0];
    console.log(command);

    switch(command)
    {
    case "submissions":
    case "sub":
    case "s":
        return importFresh("./submissions.js");
    default:
        return yargs.showHelp();
    }

}


//#SECTION on execute

try
{
    if(!process.stdin.isTTY)
        throw new Errors.NoStdinError("The process doesn't have an stdin channel to read input from");
    else
        run();
}
catch(err)
{
    console.error(`${col.red}${err.message}${col.rst}\n${err.stack}\n`);

    exit(0);
}
