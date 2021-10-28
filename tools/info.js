const { Errors, colors, allOfType } = require("svcorelib");
const { join, resolve } = require("path");

const { getEnv } = require("../src/env");
const parseJokes = require("../src/parseJokes");

const languages = require("../src/languages");
const translate = require("../src/translate");
const settings = require("../settings");
const { readdir } = require("fs-extra");

const col = colors.fg;
const { exit } = process;


/** @typedef {import("./types").SubmissionCountResult} SubmissionCountResult */


async function run()
{
    try
    {
        try
        {
            await languages.init();

            await translate.init();

            await parseJokes.init();
        }
        catch(err)
        {
            console.log(`\n${col.red}Error while initializing:${col.rst}${err instanceof Error ? `${err.message}\n${err.stack}` : `\n${err.toString()}`}\n`);
            exit(1);
        }

        const { jokes, subm } = await getInfo("submissions");

        /** Decorates a value with colors and other stuff */
        const v = val => {
            const valCol = typeof val === "number" ? (val > 0 ? col.green : col.yellow) : "";
            const counter = Array.isArray(val) ? `${val.length === 0 ? `${col.yellow}(` : `(${col.green}`}${val.length}${val.length !== 0 ? col.rst : ""})${col.rst} ` : "";
            const value = Array.isArray(val) && allOfType(val, "string") ? val.join(`${col.rst}, ${valCol}`) : val;

            return `${counter}${valCol}${value}${col.rst}`;
        };

        const lines = [
            `${settings.info.name} v${settings.info.version} [${getEnv()}] - Info`,
            ``,
            `${col.blue}Jokes:${col.rst}`,
            `  Total amount:   ${v(jokes.totalAmt)}`,
            `  Joke languages: ${v(jokes.languages)}`,
            ``,
            `${col.blue}Submissions:${col.rst}`,
            `  Amount:    ${v(subm.amount)}`,
            `  Languages: ${v(subm.languages)}`,
        ];

        process.stdout.write(`\n${lines.join("\n")}\n\n`);

        exit(0);
    }
    catch(err)
    {
        console.log(`\n${col.red}Error while displaying info:${col.rst}${err instanceof Error ? `${err.message}\n${err.stack}` : `\n${err.toString()}`}\n`);
        exit(1);
    }
}

/**
 * Returns all information about JokeAPI
 */
async function getInfo()
{
    const { allJokes } = parseJokes;

    const jokeLangs = Object.keys(allJokes.getJokeCountPerLang());

    const { submCount, submLangs } = await getSubmissionCount();

    // TODO:
    return {
        jokes: {
            totalAmt: allJokes._jokeCount,
            languages: jokeLangs,
        },
        subm: {
            amount: submCount,
            languages: submLangs,
        },
        // ...
    }
}

/**
 * Resolves with the amount of submissions JokeAPI has saved locally
 * @returns {Promise<SubmissionCountResult, Error>}
 */
function getSubmissionCount()
{
    return new Promise(async (res, rej) => {
        try
        {
            const submBasePath = resolve(settings.jokes.jokeSubmissionPath);

            const langs = await readdir(submBasePath);

            const submFolders = langs.map(lang => join(submBasePath, lang));

            const submissionFiles = [];

            for await(const folder of submFolders)
                (await readdir(folder))
                    .forEach(file => submissionFiles.push(file));

            return res({
                submCount: submissionFiles.length,
                submLangs: langs,
            });
        }
        catch(err)
        {
            return rej(err);
        }
    });
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
