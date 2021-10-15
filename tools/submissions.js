const { readdir, readFile } = require("fs-extra");
const { resolve, join } = require("path");
const { colors, Errors, unused, reserialize } = require("svcorelib");
const prompt = require("prompts");
const promiseAllSeq = require("promise-all-sequential");

const languages = require("../src/languages");
const parseJokes = require("../src/parseJokes");
// const jokeSubmission = require("../src/jokeSubmission");

const settings = require("../settings");
const { isEmpty } = require("lodash");

const col = colors.fg;
const { exit } = process;

/** @type {LastEditedSubmission} */
let lastSubmissionType;
/** @type {number} */
let currentSub;
/** @type {boolean} */
let lastKeyInvalid = false;


//#SECTION types & init

/** @typedef {import("./types").AllSubmissions} AllSubmissions */
/** @typedef {import("./types").Submission} Submission */
/** @typedef {import("./types").ParsedFileName} ParsedFileName */
/** @typedef {import("./types").ReadSubmissionsResult} ReadSubmissionsResult */
/** @typedef {import("./types").LastEditedSubmission} LastEditedSubmission */
/** @typedef {import("./types").KeypressResult} KeypressResult */
/** @typedef {import("../src/types/jokes").JokeSubmission} JokeSubmission */
/** @typedef {import("../src/types/jokes").JokeFlags} JokeFlags */
/** @typedef {import("../src/types/languages").LangCode} LangCodes */


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

    lastSubmissionType = undefined;
    currentSub = 1;

    /** @type {LangCodes} */
    const langCodes = await getLangCodes();
    const { submissions, amount } = await readSubmissions(langCodes);

    const { proceed } = await prompt({
        message: `There are ${amount} submissions of ${Object.keys(submissions).length} languages. Go through them now?`,
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

    for await(const lang of langs)
    {
        /** @type {Submission[]} */
        const submissions = allSubmissions[lang];

        // /** @type {(() => Promise)[]} */
        const proms = submissions.map((sub) => (() => actSubmission(sub)));

        await promiseAllSeq(proms);
    }

    return finishPrompts();
}

/**
 * Prompts the user to act on a submission
 * @param {Submission} sub
 * @returns {Promise<void, Error>}
 */
function actSubmission(sub)
{
    return new Promise(async (res, rej) => {
        try
        {
            console.clear();

            let lastSubmText = "";
            switch(lastSubmissionType)
            {
            case "accepted_safe":
                lastSubmText = `(Last submission was accepted ${col.green}safe${col.rst})`;
                break;
            case "accepted_unsafe":
                lastSubmText = `(Last submission was accepted ${col.yellow}unsafe${col.rst})`;
                break;
            case "edited":
                lastSubmText = `(Last submission was ${col.magenta}edited${col.rst})`;
                break;
            case "deleted":
                lastSubmText = `(Last submission was ${col.red}deleted${col.rst})`;
                break;
            }

            const last = !lastKeyInvalid ? (lastSubmissionType ? lastSubmText : "") : `${col.red}Invalid key - try again${col.rst}`;

            console.log(`${last}\n\n------------\nLanguage: ${sub.lang}\n------------\n`);

            printSubmission(sub, currentSub);

            /** @type {null|Submission} The submission to be added to the local jokes */
            let finalSub = null;

            const key = await getKey(`\n${col.blue}Choose action:${col.rst} Accept ${col.green}[S]${col.rst}afe • Accept ${col.yellow}[U]${col.rst}nsafe • ${col.magenta}[E]${col.rst}dit • ${col.red}[D]${col.rst}elete`);

            let safe = false;

            switch(key.name)
            {
            case "s": // add safe
                safe = true;
                lastSubmissionType = "accepted_safe";
                finalSub = reserialize(sub);
                break;
            case "u": // add unsafe
                lastSubmissionType = "accepted_unsafe";
                finalSub = reserialize(sub);
                break;
            case "e": // edit
                lastSubmissionType = "edited";
                finalSub = await editSubmission(sub);
                break;
            case "d": // delete
                lastSubmissionType = "deleted";
                return res();
            default: // invalid key
                lastKeyInvalid = true;
                return await actSubmission(sub);
            }

            if(finalSub)
                finalSub.joke.safe = safe;

            currentSub++;

            // if not deleted in editSubmission()
            if(finalSub !== null)
                await addSubmission(finalSub);

            return res();
        }
        catch(err)
        {
            return rej(new Error(`Error while choosing action for submission #${currentSub}: ${err}`));
        }
    });
}

/**
 * Gets called to edit a submission
 * @param {Submission} sub
 * @returns {Promise<Submission>} Returns the edited submission
 */
function editSubmission(sub)
{
    return new Promise(async (res, rej) => {
        /** @type {Submission} */
        const editedSub = reserialize(sub);

        try
        {
            // TODO: display joke

            const jokeChoices = sub.joke.type === "single" ? [
                {
                    title: `Joke (${editedSub.joke.joke})`,
                    value: "joke",
                },
            ] : [
                {
                    title: `Setup (${editedSub.joke.setup})`,
                    value: "setup",
                },
                {
                    title: `Delivery (${editedSub.joke.delivery})`,
                    value: "delivery",
                },
            ];

            const choices = [
                {
                    title: `Category (${editedSub.joke.category})`,
                    value: "category",
                },
                {
                    title: `Type (${editedSub.joke.type})`,
                    value: "type",
                },
                ...jokeChoices,
                {
                    title: `Flags (${extractFlags(editedSub.joke)})`,
                    value: "flags",
                },
                {
                    title: `Safe (${editedSub.joke.safe})`,
                    value: "safe",
                },
                {
                    title: `${col.green}[Done]${col.rst}`,
                    value: "done",
                },
                {
                    title: `${col.red}[Delete]${col.rst}`,
                    value: "delete",
                },
            ];

            process.stdout.write("\n");

            const { action } = await prompt({
                message: "Edit property",
                type: "select",
                name: "action",
                choices,
            });

            // TODO:
            switch(action)
            {
            case "category":
            {
                const catChoices = settings.jokes.possible.categories.map(cat => ({ title: cat, value: cat }));

                const { category } = await prompt({
                    type: "select",
                    message: `Select new category`,
                    name: "category",
                    choices: catChoices,
                    initial: settings.jokes.possible.categories.indexOf("Misc"),
                });

                editedSub.joke.category = category;
                break;
            }
            case "joke":
            case "setup":
            case "delivery":
                editedSub.joke[action] = (await prompt({
                    type: "text",
                    message: `Enter new value for ${action}`,
                    name: "val",
                    validate: (val) => !isEmpty(val),
                })).val;
                break;
            case "type":
                editedSub.joke.type = (await prompt({
                    type: "select",
                    message: "Select a new joke type",
                    choices: [
                        { title: "Single", value: "single" },
                        { title: "Two Part", value: "twopart" },
                    ],
                    name: "val",
                })).val;
                break;
            case "flags":
                {
                const flagKeys = Object.keys(editedSub.joke.flags);
                const flagChoices = [];

                flagKeys.forEach(key => {
                    flagChoices.push({
                        title: key,
                        selected: editedSub.joke.flags[key] === true,
                    });
                });

                const { newFlags } = await prompt({
                    type: "multiselect",
                    message: "Edit joke flags",
                    choices: flagChoices,
                    name: "newFlags",
                    instructions: false,
                    hint: "- arrow-keys to move, space to toggle, return to submit",
                });

                Object.keys(editedSub.joke.flags).forEach(key => {
                    editedSub.joke.flags[key] = false;
                });

                newFlags.forEach(setFlagIdx => {
                    const key = flagKeys[setFlagIdx];
                    editedSub.joke.flags[key] = true;
                });

                break;
            }
            case "safe":
                editedSub.joke.safe = (await prompt({
                    type: "confirm",
                    message: "Is this joke safe?",
                    initial: false,
                    name: "del",
                })).del;
                break;
            case "done":
                return res(Object.freeze(editedSub));
            case "delete":
            {
                const { del } = await prompt({
                    type: "confirm",
                    message: "Delete this submission?",
                    name: "del",
                });

                if(del)
                {
                    lastSubmissionType = "deleted";
                    return res(null);
                }

                break;
            }
            default:
                return res(Object.freeze(editedSub));
            }

            return res(await editSubmission(editedSub));
        }
        catch(err)
        {
            return rej(new Error(`Error while editing submission: ${err}`));
        }
    });
}

/**
 * Prints a submission to the console
 * @param {Submission} sub
 * @param {number} index Current index of the submission
 */
function printSubmission(sub, index)
{
    const lines = [
        `Submission #${index} by ${sub.client}:`,
        `  Category: ${sub.joke.category}`,
        `  Type:     ${sub.joke.type}`,
        `  Flags:    ${extractFlags(sub.joke)}`,
        ``,
    ];

    if(sub.joke.type === "single")
        lines.push(sub.joke.joke);
    if(sub.joke.type === "twopart")
    {
        lines.push(sub.joke.setup);
        lines.push(sub.joke.delivery);
    }

    process.stdout.write(`${lines.join("\n")}\n\n`);
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

/**
 * Waits for the user to press a key, then returns it
 * @param {string} [prompt]
 * @returns {Promise<KeypressResult, Error>}
 */
function getKey(prompt)
{
    return new Promise(async (res, rej) => {
        if(typeof prompt === "string")
            prompt = `${prompt.trimRight()} `;

        try
        {
            const onKey = (ch, key) => {
                if(key && key.ctrl && ["c", "d"].includes(key.name))
                    process.exit(0);

                process.stdin.setRawMode(false);
                process.stdin.pause();

                process.stdin.removeListener("keypress", onKey);

                if(typeof prompt === "string")
                    process.stdout.write("\n");

                return res({
                    name: key.name || ch || "",
                    ctrl: key.ctrl || false,
                    meta: key.meta || false,
                    shift: key.shift || false,
                    sequence: key.sequence || undefined,
                    code: key.code || undefined,
                });
            };
            
            process.stdin.setRawMode(true);
            process.stdin.on("keypress", onKey);

            if(typeof prompt === "string")
                process.stdout.write(prompt);
        
            process.stdin.resume();
        }
        catch(err)
        {
            return rej(new Error(`Error while getting key: ${err}`));
        }
    });
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
 * @returns {Promise<ReadSubmissionsResult, Error>}
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

            let amount = 0;

            folders.forEach(langCode => {
                langCode = langCode.toString();

                if(!langCodes.includes(langCode)) // ignore folders that aren't valid
                    return;

                readPromises.push(new Promise(async res => {
                    const subm = await getSubmissions(langCode);

                    if(subm.length > 0)
                        allSubmissions[langCode] = subm;

                    amount += subm.length;

                    return res();
                }));
            });

            await Promise.all(readPromises);

            return res({
                submissions: allSubmissions,
                amount
            });
        }
        catch(err)
        {
            return rej(new Error(`Error while reading submissions: ${err}`));
        }
    });
}

/**
 * Reads all submissions of the specified language
 * @param {LangCodes} lang 
 * @returns {Promise<Submission[], Error>}
 */
function getSubmissions(lang)
{
    return new Promise(async (res, rej) => {
        /** @type {Submission[]} */
        const submissions = [];

        try
        {
            const submissionsFolder = join(settings.jokes.jokeSubmissionPath, lang);
            const files = await readdir(submissionsFolder);

            for await(const fileName of files)
            {
                const file = await readFile(join(submissionsFolder, fileName));
                /** @type {JokeSubmission} */
                const joke = JSON.parse(file);

                const valRes = parseJokes.validateSingle(joke, lang);
                let errors = null;

                if(Array.isArray(valRes))
                    errors = valRes;

                const { client, timestamp, index } = parseFileName(fileName);

                unused(index);

                submissions.push({ client, joke, timestamp, errors, lang });
            }

            return res(submissions);
        }
        catch(err)
        {
            return rej(new Error(`Error while reading submissions of language '${lang}': ${err}`));
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
 * @param {boolean} [safe=false]
 */
function addSubmission(sub, safe = false)
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
