/**
 * Goes through submissions and prompts the user what to do with them (add, delete or edit)  
 *   
 * - Enjoy this over-engineered pile of garbage that is actually pretty cool -
 * 
 * @author Sv443
 * @since 2.3.2
 * @ref #340 - https://github.com/Sv443/JokeAPI/issues/340
 */

const { readdir, readFile, writeFile, copyFile, rm, rmdir } = require("fs-extra");
const { resolve, join } = require("path");
const { colors, Errors, reserialize, filesystem, isEmpty, allOfType, mapRange } = require("svcorelib");
const prompt = require("prompts");
const promiseAllSeq = require("promise-all-sequential");
const Fuse = require("fuse.js");

const languages = require("../src/languages");
const translate = require("../src/translate");
const parseJokes = require("../src/parseJokes");
const { reformatJoke } = require("../src/jokeSubmission");
const { strToCol } = require("../src/logRequest");

const settings = require("../settings");

const col = colors.fg;
const { exit } = process;


//#MARKER types & init

/** @typedef {import("./types").DuplicateSubmsFilterObj} DuplicateSubmsFilterObj */
/** @typedef {import("./types").ReadSubmissionsResult} ReadSubmissionsResult */
/** @typedef {import("./types").LastEditedSubmission} LastEditedSubmission */
/** @typedef {import("./types").AllSubmissions} AllSubmissions */
/** @typedef {import("./types").ParsedFileName} ParsedFileName */
/** @typedef {import("./types").Submission} Submission */
/** @typedef {import("./types").Keypress} Keypress */
/** @typedef {import("../src/types/jokes").JokeSubmission} JokeSubmission */
/** @typedef {import("../src/types/jokes").JokeFlags} JokeFlags */
/** @typedef {import("../src/types/jokes").JokesFile} JokesFile */
/** @typedef {import("../src/types/languages").LangCode} LangCodes */


/** @type {LastEditedSubmission} */
let lastSubmissionType;
/** @type {number} */
let currentSub;
/** @type {boolean} */
let lastKeyInvalid = false;


const stats = {
    /** How many submissions were acted on */
    submissionsActAmt: 0,
    /** How many submissions were saved */
    savedSubmissions: 0,
    /** How many submissions were deleted / discarded */
    deletedSubmissions: 0,
    /** How many submissions were edited */
    editedSubmissions: 0,
};


/**
 * Entrypoint of this tool
 */
async function run()
{
    try
    {
        await languages.init();

        await translate.init();

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

    if(amount === 0)
    {
        console.log("\nFound no submissions to go through. Exiting.\n");
        exit(0);
    }

    const langCount = Object.keys(submissions).length;

    const { proceed } = await prompt({
        message: `There ${amount == 1 ? "is" : "are"} ${amount} submission${amount == 1 ? "" : "s"} of ${langCount} language${langCount == 1 ? "" : "s"}. Go through ${amount == 1 ? "it" : "them"} now?`,
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


//#MARKER prompts

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

        /** @type {(() => Promise)[]} */
        const proms = submissions.map((sub) => (() => actSubmission(sub)));

        await promiseAllSeq(proms);

        const langSubfolderPath = resolve(settings.jokes.jokeSubmissionPath, lang);

        await cleanupDir(langSubfolderPath);
    }

    return finishPrompts();
}

//#SECTION act on submission

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

            printSubmission(sub);

            /** @type {null|Submission} The submission to be added to the local jokes */
            let finalSub = null;

            const key = await getKey(`\n${col.blue}Choose action:${col.rst} Accept ${col.green}[S]${col.rst}afe • Accept ${col.magenta}[U]${col.rst}nsafe • ${col.yellow}[E]${col.rst}dit • ${col.red}[D]${col.rst}elete`);

            let safe = false;

            switch(key.name)
            {
            case "s": // add safe
                safe = true;
                lastSubmissionType = "accepted_safe";
                finalSub = reserialize(sub);
                currentSub++;
                break;
            case "u": // add unsafe
                lastSubmissionType = "accepted_unsafe";
                finalSub = reserialize(sub);
                currentSub++;
                break;
            case "e": // edit
                lastSubmissionType = "edited";
                finalSub = await editSubmission(sub);
                currentSub++;
                break;
            case "d": // delete
                lastSubmissionType = "deleted";
                await deleteSubmission(sub);
                currentSub++;
                return res();
            default: // invalid key
                lastKeyInvalid = true;
                return await actSubmission(sub);
            }

            if(finalSub && lastSubmissionType != "edited")
                finalSub.joke.safe = safe;

            // if not deleted in editSubmission()
            if(finalSub !== null)
                await saveSubmission(finalSub);

            return res();
        }
        catch(err)
        {
            return rej(new Error(`Error while choosing action for submission #${currentSub}: ${err}`));
        }
    });
}

//#SECTION edit submission

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

        /** @param {Submission} finalSub */
        const trySubmit = async (finalSub) => {
            if(typeof finalSub.joke.lang !== "string")
                finalSub.joke.lang = finalSub.lang;

            const validateRes = parseJokes.validateSubmission(finalSub.joke, finalSub.lang);
            const allErrors = Array.isArray(validateRes) ? validateRes : [];

            if(typeof finalSub.joke.safe !== "boolean")
                allErrors.push("Property 'safe' is not of type boolean");

            if(allErrors.length > 0)
            {
                console.log(`${col.red}Joke is invalid:${col.rst}`);
                console.log(`- ${allErrors.join("\n- ")}\n`);

                await getKey("Press any key to try again.");

                return res(editSubmission(finalSub)); // async recursion, who doesn't love it
            }
            else
            {
                stats.editedSubmissions++;
                return res(Object.freeze(finalSub));
            }
        };

        try
        {
            /**
             * Reformats a value to make it fit a single line
             * @param {string} val
             */
            const fitVal = val => {
                val = val.replace(/\n/g, "\\n");

                return val;
            };

            const jokeChoices = sub.joke.type === "single" ? [
                {
                    title: `Joke (${fitVal(editedSub.joke.joke)})`,
                    value: "joke",
                },
            ] : [
                {
                    title: `Setup (${fitVal(editedSub.joke.setup)})`,
                    value: "setup",
                },
                {
                    title: `Delivery (${fitVal(editedSub.joke.delivery)})`,
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
                    title: `${col.green}[Submit]${col.rst}`,
                    value: "submit",
                },
                {
                    title: `${col.red}[Delete]${col.rst}`,
                    value: "delete",
                },
            ];

            process.stdout.write("\n");
            
            const { editProperty } = await prompt({
                message: "Edit property",
                type: "select",
                name: "editProperty",
                hint: "- Use arrow-keys. Return to select. Esc or Ctrl+C to submit.",
                choices,
            });

            switch(editProperty)
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
                editedSub.joke[editProperty] = (await prompt({
                    type: "text",
                    message: `Enter new value for '${editProperty}' property`,
                    name: "val",
                    initial: editedSub.joke[editProperty] || "",
                    validate: (val) => (!isEmpty(val) && val.length >= settings.jokes.submissions.minLength),
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
                    name: "type",
                })).type;
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
                    name: "safe",
                })).safe;
                break;
            case "submit":
                return trySubmit(editedSub);
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

                    await deleteSubmission(sub);

                    return res(null);
                }

                break;
            }
            default:
                return trySubmit(editedSub);
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
 * Deletes/discards a submission
 * @param {Submission} sub
 * @returns {Promise<void, Error>}
 */
function deleteSubmission(sub)
{
    return new Promise(async (res, rej) => {
        try
        {
            await rm(sub.path);

            stats.submissionsActAmt++;
            stats.deletedSubmissions++;

            return res();
        }
        catch(err)
        {
            return rej(new Error(`Error while deleting submission at path '${sub.path}': ${err}`));
        }
    });
}

/**
 * Cleans up the submission directories if they're empty
 * @param {string} path Path to the submission language subfolder
 * @returns {Promise<void, Error>}
 */
function cleanupDir(path)
{
    return new Promise(async (res, rej) => {
        try
        {
            const subDirFiles = await readdir(path);

            if(subDirFiles.length === 0)
                await rmdir(path);

            return res();
        }
        catch(err)
        {
            return rej(new Error(`Error while cleaning up directories: ${err}`));
        }
    });
}

//#SECTION print submission

/**
 * Prints a submission to the console
 * @param {Submission} sub
 */
function printSubmission(sub)
{
    const formatScore = (score) => {
        let sCol = col.green;

        if(score < 0.75)
            sCol = col.red;
        else if(score < 0.85)
            sCol = col.yellow;

        return `${sCol}${Math.round(mapRange(score, 0, 1, 0, 100))}%${col.rst}`;
    }

    const lines = [
        `Submission #${currentSub} by ${strToCol(sub.client)}${sub.client}${col.rst}:`,
        `  Category:   ${sub.joke.category}`,
        `  Type:       ${sub.joke.type}`,
        `  Flags:      ${extractFlags(sub.joke)}`,
        `  Uniqueness: sub=${formatScore(sub.uniqueScore)} int=${col.green}69%${col.rst}`,
        ``,
    ];

    /**
     * Reformats a value
     * @param {string} val
     * @param {string} color
     */
    const refmt = (val, color) => {
        val = val.replace(/\n/g, `\n${color}> ${col.rst}`);

        return `${color}> ${col.rst}${val}`;
    };

    if(sub.joke.type === "single")
        lines.push(refmt(sub.joke.joke, col.green));
    if(sub.joke.type === "twopart")
    {
        lines.push(refmt(sub.joke.setup, col.cyan));
        lines.push("");
        lines.push(refmt(sub.joke.delivery, col.green));
    }

    process.stdout.write(`${lines.join("\n")}\n\n`);
}

/**
 * Extracts flags of a joke submission, returning a string representation
 * @param {JokeSubmission} joke
 * @returns {string} Returns flags delimited with `, ` or "none" if no flags are set
 */
function extractFlags(joke)
{
    /** @type {JokeFlags[]} */
    const flags = [];

    Object.keys(joke.flags).forEach(key => {
        if(joke.flags[key] === true)
            flags.push(key);
    });

    return flags.length > 0 ? flags.join(", ") : "none";
}

/**
 * Called when all submissions have been gone through
 */
function finishPrompts()
{
    console.log("\nFinished going through submissions.\n");

    const statLines = [
        `Stats:`,
        `  Submissions acted on: ${stats.submissionsActAmt}`,
        `  Submissions edited:   ${stats.editedSubmissions}`,
        `  Submissions deleted:  ${stats.deletedSubmissions}`,
    ];

    console.log(statLines.join("\n"));

    console.log(`\nExiting.\n`);

    exit(0);
}


//#MARKER internal stuff

/**
 * Waits for the user to press a key, then resolves with info about it
 * @param {string} [prompt]
 * @returns {Promise<Keypress, Error>}
 */
function getKey(prompt)
{
    return new Promise(async (res, rej) => {
        if(typeof prompt === "string")
            prompt = isEmpty(prompt) ? null : `${prompt.trimRight()} `;

        try
        {
            const onKey = (ch, key) => {
                if(key && key.ctrl && ["c", "d"].includes(key.name))
                    process.exit(0);

                process.stdin.pause();
                process.stdin.removeListener("keypress", onKey);

                process.stdin.setRawMode(false);

                prompt && process.stdout.write("\n");

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

            prompt && process.stdout.write(prompt);
        
            process.stdin.resume();
        }
        catch(err)
        {
            return rej(new Error(`Error while getting key: ${err}`));
        }
    });
}

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

            let amount = 0;

            if(folders.length < 1)
            {
                return res({
                    submissions: [],
                    amount,
                });
            }

            /** @type {Promise<void>[]} */
            const readPromises = [];

            folders.forEach(langCode => {
                langCode = langCode.toString();

                if(!langCodes.includes(langCode)) // ignore folders that aren't valid
                    return;

                readPromises.push(new Promise(async readRes => {
                    const subm = await getSubmissions(langCode);

                    if(subm.length > 0)
                        allSubmissions[langCode] = subm;

                    amount += subm.length;

                    return readRes();
                }));
            });

            await Promise.all(readPromises);

            return res({
                submissions: allSubmissions,
                amount,
            });
        }
        catch(err)
        {
            return rej(new Error(`Error while reading submissions: ${err}`));
        }
    });
}

/**
 * Trims leading and trailing whitespaces of a joke submission object (loses reference to input param)
 * @param {JokeSubmission} subm
 * @returns {JokeSubmission}
 */
function trimSubm(subm)
{
    /** @type {JokeSubmission} */
    let retSubm = reserialize(subm);

    if(retSubm.type === "single")
        retSubm.joke = typeof retSubm.joke === "string" ? retSubm.joke.trim() : retSubm.joke;
    else if(retSubm.type === "twopart")
    {
        retSubm.setup = typeof retSubm.setup === "string" ? retSubm.setup.trim() : retSubm.setup;
        retSubm.delivery = typeof retSubm.delivery === "string" ? retSubm.delivery.trim() : retSubm.delivery;
    }

    return retSubm;
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
                const path = resolve(submissionsFolder, fileName);

                const file = await readFile(path);
                /** @type {JokeSubmission} */
                const joke = trimSubm(JSON.parse(file));

                const valRes = parseJokes.validateSubmission(joke, lang);
                let errors = null;

                if(Array.isArray(valRes))
                    errors = valRes;

                const { client, timestamp } = parseFileName(fileName);

                submissions.push({ client, joke, timestamp, errors, lang, path });
            }

            return res(filterDuplicates(submissions));
        }
        catch(err)
        {
            return rej(new Error(`Error while reading submissions of language '${lang}': ${err}`));
        }
    });
}

/**
 * Removes duplicate submissions and adds a "duplicate score" to each submission
 * @param {Submission[]} submissions
 * @returns {Submission[]}
 */
function filterDuplicates(submissions)
{
    return new Promise(async (res) => {
        if(!Array.isArray(submissions) || !allOfType(submissions, "object"))
            throw new TypeError(`Submissions parameter is not an array of objects`);

        /** @type {Submission[]} */
        const retSubms = [];

        for await(const subm of submissions)
        {
            const { joke } = subm;

            const fuseProps = {
                includeScore: true,
                shouldSort: true,
                threshold: settings.jokes.submissions.fuseThreshold,
            };

            const fuses = [];

            if(joke.type === "single")
            {
                fuses.push({
                    fuse: new Fuse(retSubms, { ...fuseProps, keys: [ "joke.joke" ] }),
                    jokeText: joke.joke,
                });
            }
            else
            {
                fuses.push({
                    fuse: new Fuse(retSubms, { ...fuseProps, keys: [ "joke.setup" ] }),
                    jokeText: joke.setup,
                });

                fuses.push({
                    fuse: new Fuse(retSubms, { ...fuseProps, keys: [ "joke.delivery" ] }),
                    jokeText: joke.delivery,
                });
            }

            const scores = [];

            fuses.forEach(fuseObj => {
                const { fuse, jokeText } = fuseObj;

                const matches = fuse.search(jokeText);

                if(matches[0])
                    scores.push(matches[0].score);
            });

            /** 0.0 = exact duplicate, 1.0 = unique */
            const uniqueScore = scores.length > 0 ? scores.reduce((ac, cu) => ac + cu, 0) / scores.length : 1.0;

            if(uniqueScore > 0.55)
                retSubms.push({ ...subm, uniqueScore });
            else
                await deleteSubmission(subm);
        }

        return res(retSubms);
    });
}

/**
 * Parses the file name of a submission, returning its information
 * @param {string} fileName
 * @returns {Readonly<ParsedFileName>}
 */
function parseFileName(fileName)
{
    // example:  submission_eff8e7ca_0_1634205492859.json

    if(fileName.startsWith("submission_"))
        fileName = fileName.substr(11);
    if(fileName.endsWith(".json"))
        fileName = fileName.substr(0, fileName.length - 5);

    // example:  eff8e7ca_0_1634205492859

    const [ client, index, timestamp ] = fileName.split("_");

    return Object.freeze({
        client,
        index: parseInt(index),
        timestamp: parseInt(timestamp),
    });
}

/**
 * Saves a submission to the local jokes
 * @param {Submission} sub
 */
function saveSubmission(sub)
{
    return new Promise(async (res, rej) => {
        try
        {
            stats.savedSubmissions++;
            stats.submissionsActAmt++;

            const { lang } = sub;
            const joke = reformatJoke(sub.joke);

            const jokeFilePath = join(settings.jokes.jokesFolderPath, `jokes-${lang}.json`);
            const templatePath = join(settings.jokes.jokesFolderPath, settings.jokes.jokesTemplateFile);

            if(!(await filesystem.exists(jokeFilePath)))
                await copyFile(templatePath, jokeFilePath);


            /** @type {JokesFile} */
            const currentJokesFile = JSON.parse((await readFile(jokeFilePath)).toString());
            /** @type {any} */
            const currentJokes = reserialize(currentJokesFile.jokes);

            const newId = (Array.isArray(currentJokes) && currentJokes.length > 0) ? currentJokes[currentJokes.length - 1].id + 1 : 0;

            // ensure props match and strip extraneous props
            joke.id = newId;
            joke.lang && delete joke.lang;
            joke.formatVersion && delete joke.formatVersion;

            currentJokes.push(joke);

            currentJokesFile.jokes = currentJokes;


            await writeFile(jokeFilePath, JSON.stringify(currentJokesFile, undefined, 4));

            await rm(sub.path);


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
    else
        run();
}
catch(err)
{
    console.error(`${col.red}${err.message}${col.rst}\n${err.stack}\n`);

    exit(1);
}
