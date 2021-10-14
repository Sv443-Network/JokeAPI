const { readdir, readFile } = require("fs-extra");
const { resolve, join } = require("path");
const { colors, Errors } = require("svcorelib");

// const parseJokes = require("../src/parseJokes");
// const jokeSubmission = require("../src/jokeSubmission");

const settings = require("../settings");

const col = colors.fg;


/** @typedef {import("./types").AllSubmissions} AllSubmissions */
/** @typedef {import("./types").Submission} Submission */
/** @typedef {import("../src/types/languages").LangCodes} LangCodes */


async function run()
{
    /** @type {LangCodes} */
    const langCodes = await getLangCodes();
    const submissions = await readSubmissions(langCodes);

    // TODO:
    console.log(submissions);
}

//#SECTION prompts



//#SECTION internal stuff

/**
 * Reads all possible language codes and resolves with them
 * @returns {Promise<LangCodes[], Error>}
 */
function getLangCodes()
{
    return new Promise(async (res, rej) => {
        try
        {
            const file = await readFile(resolve(settings.languages.langFilePath));
            const parsed = JSON.parse(file.toString());

            return res(Object.keys(parsed));
        }
        catch(err)
        {
            return rej(new Error(`Error while reading language codes: ${err}`));
        }
    });
}

/**
 * Reads all submissions and resolves with them
 * @param {LangCodes} langCodes
 * @returns {Promise<(AllSubmissions|null), Error>} Resolves null if no submissions were found
 */
function readSubmissions(langCodes)
{
    /** @type {AllSubmissions} */
    const allSubmissions = {};

    return new Promise(async (res, rej) => {
        try
        {
            const folders = await readdir(resolve(settings.jokes.jokeSubmissionPath));

            if(folders.length < 1)
                return res(null);

            /** @type {Promise<void>[]} */
            const readPromises = [];

            folders.forEach(langCode => {
                langCode = langCode.toString();

                if(!langCodes.includes(langCode)) // ignore folders that don't match
                    return;

                readPromises.push(new Promise(async res => {
                    const subm = await getSubmissions(langCode);

                    if(subm.length > 0)
                        allSubmissions[langCode] = subm;

                    return res();
                }));
            });

            await Promise.all(readPromises);

            return res(allSubmissions);
        }
        catch(err)
        {
            return rej(new Error(`Error while reading submissions: ${err}`));
        }
    });
}

/**
 * Reads all submissions of the specified language
 * @param {LangCodes} langCode 
 * @returns {Promise<Submission[], Error>}
 */
function getSubmissions(langCode)
{
    return new Promise(async (res, rej) => {
        /** @type {Submission[]} */
        const submissions = [];

        try
        {
            const submissionsFolder = join(settings.jokes.jokeSubmissionPath, langCode);
            const files = await readdir(submissionsFolder);

            for await(const fileName of files)
            {
                const file = await readFile(join(submissionsFolder, fileName));
                const joke = JSON.parse(file);

                // TODO: ensure submission validity with parseJokes.validateSingle()
                // TODO: populate props

                submissions.push({
                    ipHash: "test",
                    joke,
                    timestamp: NaN,
                });
            }

            return res(submissions);
        }
        catch(err)
        {
            return rej(new Error(`Error while reading submissions of language '${langCode}': ${err}`));
        }
    });
}


try
{
    if(!process.stdin.isTTY)
        throw new Errors.NoStdinError("The process doesn't have an stdin channel to read input from");
    else run();
}
catch(err)
{
    console.error(`${col.red}${err.message}${col.rst}\n${err.stack}\n`);

    process.exit(0);
}
