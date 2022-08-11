const { colors, files, reserialize } = require("svcorelib");
const { join, resolve } = require("path");
const { readdir } = require("fs-extra");

const { getEnv, getProp } = require("../src/env");
const parseJokes = require("../src/parseJokes");
const languages = require("../src/languages");
const translate = require("../src/translate");
const splashes = require("../src/splashes");

const settings = require("../settings");

const col = colors.fg;
const { getSplash } = splashes;
const { exit } = process;


/** @typedef {import("svcorelib").Stringifiable} Stringifiable */
/** @typedef {import("./types").SubmissionInfoResult} SubmissionInfoResult */
/** @typedef {import("./types").InfoCategoryValues} InfoCategoryValues */
/** @typedef {import("../src/types/languages").LangCode} LangCode */


async function run()
{
    try
    {
        try
        {
            await languages.init();

            await translate.init();

            await splashes.init();

            await parseJokes.init();
        }
        catch(err)
        {
            console.log(`\n${col.red}Error while initializing:${col.rst}${err instanceof Error ? `${err.message}\n${err.stack}` : `\n${err.toString()}`}\n`);
            exit(1);
        }

        const { jokes, subm, http } = await getInfo("submissions");


        const additionalInfo = ` v${settings.info.version} [${getEnv(true)}] - Info`;
        const infoLine = `${col.blue}${settings.info.name}${col.rst}${additionalInfo}`;
        const infoLen = settings.info.name.length + additionalInfo.length - (col.cyan.length + col.rst.length);

        const splash = `${getSplash("en")}`;

        let sepLine = "";
        for(let i = 0; i < Math.max(infoLen, splash.length) + 2; i++)
            sepLine += "─";

        /** The lines that get printed to the console to display JokeAPI's info */
        const lines = [
            ` ${infoLine}`,
            "",
            ` ${splash}`,
            sepLine,
            "",
            "",
            ...makeInfoCategory("Jokes", [
                {
                    name: "Total amount",
                    value: jokes.totalAmt,
                },
                {
                    name: "Joke languages",
                    value: jokes.languages,
                },
            ]),
            "",
            ...makeInfoCategory("Submissions", [
                {
                    name: "Amount",
                    value: subm.amount,
                },
                {
                    name: "Languages",
                    value: subm.languages,
                },
            ]),
            "",
            ...makeInfoCategory("HTTP Server", [
                {
                    name: "BaseURL",
                    value: http.baseUrl,
                },
                {
                    name: "Port",
                    value: http.port,
                },
            ]),
        ];

        process.stdout.write(`\n\n${lines.join("\n")}\n\n`);

        exit(0);
    }
    catch(err)
    {
        console.log(`\n${col.red}Error while displaying info:${col.rst}${err instanceof Error ? `${err.message}\n${err.stack}` : `\n${err.toString()}`}\n`);
        exit(1);
    }
}

/**
 * Creates an array of lines of an info category with its values (for nice formatting)
 * @param {string} title
 * @param {InfoCategoryValues[]} values
 * @returns {string[]}
 */
function makeInfoCategory(title, values)
{
    /** Left hand side (names of the value lines) */
    const rowsLhs = values.map(v => {
        const len = Array.isArray(v.value) ? v.value.length : 0;
        return Array.isArray(v.value) ? {
            display: `${v.name} (${len === 0 ? col.yellow : ""}${len}${len === 0 ? col.rst : ""})`,
            length: `${v.name} (${len})`.length,
        } : {
            display: v.name,
            length: v.name.length,
        };
    });

    /** @type {({ display: string, length: number })[]} */
    const rowsLhsCopy = reserialize(rowsLhs); // Array.sort() modifies the reference so reserialization is needed

    /** The length of the longest name of the value lines */
    const longestLhs = rowsLhsCopy.sort((a, b) => {
        return a.length < b.length ? 1 : -1;
    })[0].length;

    /** @type {string[]} Final rows of the value lines */
    const rows = [];

    // populate rows array
    values.forEach((v, i) => {
        const lhs = rowsLhs[i];

        const valCol = typeof v.value === "number" ? (v.value > 0 ? col.green : col.yellow) : col.green;

        const spAmt = longestLhs - lhs.length;

        let space = "  ";
        for(let i = 0; i < spAmt; i++)
            space += " ";

        const formattedVal = Array.isArray(v.value) ? (v.value.length > 0 ? `${col.green}${v.value.join(`${col.rst}, ${col.green}`)}${col.rst}` : `${col.yellow}-${col.rst}`) : v.value;

        rows.push(`  • ${lhs.display}:${space}${valCol}${formattedVal}${col.rst}`);
    });

    return [
        `${col.blue}${title}:${col.rst}`,
        ...rows,
    ];
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
    };
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

            if(!(await files.exists(submBasePath)))
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
