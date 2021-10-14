const { readdir, readFile } = require("fs-extra");
const { resolve, join } = require("path");
const { colors, Errors, unused } = require("svcorelib");
const prompt = require("prompts");

const languages = require("../src/languages");
const parseJokes = require("../src/parseJokes");
// const jokeSubmission = require("../src/jokeSubmission");

const settings = require("../settings");

const col = colors.fg;
const { exit } = process;


//#SECTION types & init

/** @typedef {import("./types").AllSubmissions} AllSubmissions */
/** @typedef {import("./types").Submission} Submission */
/** @typedef {import("./types").ParsedFileName} ParsedFileName */
/** @typedef {import("../src/types/jokes").JokeSubmission} JokeSubmission */
/** @typedef {import("../src/types/jokes").JokeFlags} JokeFlags */
/** @typedef {import("../src/types/languages").LangCodes} LangCodes */


async function run()
{
    try
    {
        await languages.init();
        await parseJokes.init();
    }
    catch(err)
    {
        throw new Error(`Error while initializing dependency modules: ${err}`);
    }

    /** @type {LangCodes} */
    const langCodes = await getLangCodes();
    const submissions = await readSubmissions(langCodes);

    const subAmt = Object.keys(submissions).length;


    const { proceed } = await prompt({
        message: `There are ${subAmt} submissions. Go through them now?`,
        type: "confirm",
        name: "proceed"
    });

    if(proceed)
        return promptSubmissions(submissions);
    else
    {
        console.log("Exiting.");
        exit(0);
    }
}

//#SECTION prompts

/**
 * Goes through all submissions, prompting about what to do with them
 * @param {AllSubmissions} allSubmissions
 */
async function promptSubmissions(allSubmissions)
{
    const langs = Object.keys(allSubmissions);

    let currentSub = 1;

    for await(const lang of langs)
    {
        /** @type {Submission[]} */
        const submissions = allSubmissions[lang];
        console.log(`\n------------\nLanguage: ${lang}\n------------\n`);

        for await(const sub of submissions)
        {
            printSubmission(sub, lang, currentSub);
            currentSub++;

            /** @type {null|Submission} The submission to be added to the local jokes */
            let finalSub = null;

            const { correct } = await prompt({
                message: "Is this joke correct?",
                type: "confirm",
                name: "correct",
            });

            if(!correct)
                finalSub = await editSubmission(sub);
            else
                finalSub = sub;

            await addSubmission(finalSub);
        }
    }

    return finishPrompts();
}

/**
 * Gets called to edit a submission
 * @param {Submission} sub
 * @returns {Promise<Submission>} Returns the edited submission
 */
function editSubmission(sub)
{
    return new Promise(async (res, rej) => {
        try
        {
            // TODO:
            return res();
        }
        catch(err)
        {
            return rej(new Error(`Error while editing submission: ${err}`));
        }
    });
}

/**
 * Prints a submission to the console
 * @param {Submission} submission
 * @param {LangCodes} lang
 * @param {number} index Current index of the submission
 */
function printSubmission(submission, lang, index)
{
    const lines = [
        `Submission #${index} [${lang}]:`,
        `  Category: ${submission.joke.category}`,
        `  Type: ${submission.joke.type}`,
        `  Flags: ${extractFlags(submission.joke)}`,

    ];

    process.stdout.write(`${lines.join("\n")}\n`);
}

/**
 * Extracts flags of a joke submission, returning a string
 * @param {JokeSubmission} joke
 * @returns {string} Returns "(none)" if no flags are set
 */
function extractFlags(joke)
{
    /** @type {JokeFlags[]} */
    const flags = [];

    Object.keys(joke.flags).forEach(key => {
        if(joke.flags[key] === true)
            flags.push(key);
    });

    return flags.length > 0 ? flags.join(", ") : "(none)";
}

/**
 * Called when all submissions have been gone through
 */
function finishPrompts()
{
    console.log("<FINISH>");

    exit(0);
}


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

                if(!langCodes.includes(langCode)) // ignore folders that aren't valid
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
                /** @type {JokeSubmission} */
                const joke = JSON.parse(file);

                const valRes = parseJokes.validateSingle(joke, langCode);
                let errors = null;

                if(Array.isArray(valRes))
                    errors = valRes;

                const { client, timestamp, index } = parseFileName(fileName);

                unused(index);

                submissions.push({ client, joke, timestamp, errors });
            }

            return res(submissions);
        }
        catch(err)
        {
            return rej(new Error(`Error while reading submissions of language '${langCode}': ${err}`));
        }
    });
}

/**
 * Parses the file name of a submission, returning its information
 * @param {string} fileName
 * @returns {Readonly<ParsedFileName>}
 */
function parseFileName(fileName)
{
    if(fileName.startsWith("submission_"))
        fileName = fileName.substr(11);
    if(fileName.endsWith(".json"))
        fileName = fileName.substr(0, fileName.length - 5);

    // eff8e7ca_0_1634205492859

    const [ client, index, timestamp ] = fileName.split("_");

    return Object.freeze({
        client,
        index: parseInt(index),
        timestamp: parseInt(timestamp),
    });
}

/**
 * Adds a submission to the local jokes
 * @param {Submission} sub
 */
function addSubmission(sub)
{
    return new Promise(async (res, rej) => {
        try
        {
            // TODO:

            return res();
        }
        catch(err)
        {
            return rej(new Error(`Error while adding submission: ${err}`));
        }
    });
}


//#SECTION on execute

try
{
    if(!process.stdin.isTTY)
        throw new Errors.NoStdinError("The process doesn't have an stdin channel to read input from");
    else run();
}
catch(err)
{
    console.error(`${col.red}${err.message}${col.rst}\n${err.stack}\n`);

    exit(0);
}
