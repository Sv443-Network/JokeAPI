const { colors, allOfType, filesystem } = require("svcorelib");
const { join, resolve } = require("path");

const { getEnv, getProp } = require("../src/env");
const parseJokes = require("../src/parseJokes");

const languages = require("../src/languages");
const translate = require("../src/translate");
const settings = require("../settings");
const { readdir } = require("fs-extra");

const col = colors.fg;
const { exit } = process;


/** @typedef {import("svcorelib").Stringifiable} Stringifiable */
/** @typedef {import("./types").SubmissionInfoResult} SubmissionInfoResult */
/** @typedef {import("../src/types/languages").LangCode} LangCode */


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

        /**
         * Decorates an array value with colors and other stuff
         * @param {Stringifiable[]} val
         */
        const n = val => {
            const ln = val.length;

            const lhs = `(${ln > 0 ? "" : col.yellow}${val.length}${col.rst})`;
            const rhs = `${ln > 0 ? col.green : col.yellow}${ln > 0 ? val.join(`${col.rst}, ${col.green}`) : "-"}${col.rst}`;
            return `${lhs}:  ${rhs}`;
        };

        /**
         * Decorates a singular value with colors and other stuff
         * @param {number|string} val
         */
        const v = val => {
            const valCol = typeof val === "number" ? (val > 0 ? col.green : col.yellow) : col.green;
            const value = Array.isArray(val) && allOfType(val, "string") ? val.join(`${col.rst}, ${valCol}`) : val;

            return `      ${valCol}${value}${col.rst}`;
        };


        const { jokes, subm, http } = await getInfo("submissions");

        /** The lines that get printed to the console to display JokeAPI's info */
        const lines = [
            `${col.blue}${settings.info.name}${col.rst} v${settings.info.version} [${getEnv(true)}] - Info`,
            ``,
            `${col.blue}Jokes:${col.rst}`,
            `  Total amount:  ${v(jokes.totalAmt)}`,
            `  Joke languages ${n(jokes.languages)}`,
            ``,
            `${col.blue}Submissions:${col.rst}`,
            `  Amount:   ${v(subm.amount)}`,
            `  Languages ${n(subm.languages)}`,
            ``,
            `${col.blue}HTTP Server:${col.rst}`,
            `  Port:    ${v(http.port)}`,
            `  BaseURL: ${v(http.baseUrl)}`,
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

    /** @type {LangCode[]} */
    const jokeLangs = Object.keys(allJokes.getJokeCountPerLang());

    const { submCount, submLangs } = await getSubmissionInfo();

    return {
        /** Internal jokes */
        jokes: {
            totalAmt: allJokes._jokeCount,
            languages: jokeLangs,
        },
        /** Joke submissions */
        subm: {
            amount: submCount,
            languages: submLangs,
        },
        /** HTTP server */
        http: {
            port: getProp("httpPort"),
            baseUrl: getProp("baseUrl"),
        },
        // ...
    }
}

/**
 * Resolves with some info about the submissions JokeAPI has received
 * @returns {Promise<SubmissionInfoResult, Error>}
 */
function getSubmissionInfo()
{
    return new Promise(async (res, rej) => {
        try
        {
            const submBasePath = resolve(settings.jokes.jokeSubmissionPath);

            if(!(await filesystem.exists(submBasePath)))
            {
                return res({
                    submCount: 0,
                    submLangs: [],
                });
            }

            const langs = await readdir(submBasePath);

            const validLangs = Array.isArray(langs) ? langs.filter((lang) => languages.isValidLang(lang)) : [];

            if(validLangs.length === 0)
            {
                return res({
                    submCount: 0,
                    submLangs: [],
                });
            }

            const submFolders = validLangs.map(lang => join(submBasePath, lang));

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

(() => {
    try
    {
        run();
    }
    catch(err)
    {
        console.error(`${col.red}${err.message}${col.rst}\n${err.stack}\n`);

        exit(0);
    }
})();
