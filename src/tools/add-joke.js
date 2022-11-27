const prompt = require("prompts");
const { colors, Errors, isEmpty, filesystem, reserialize } = require("svcorelib");
const { writeFile, copyFile, readFile } = require("fs-extra");
const { join } = require("path");

const languages = require("../src/languages");
const translate = require("../src/translate");
const parseJokes = require("../src/parseJokes");
const { validateSingle } = parseJokes;
const { reformatJoke } = require("../src/jokeSubmission");

const settings = require("../settings");

const col = colors.fg;
const { exit } = process;

/** Global data that persists until the process exits */
const data = {
    /** Whether the init() function has been called yet */
    initialized: false,
};

//#SECTION types

/** @typedef {import("tsdef").NullableProps} NullableProps */
/** @typedef {import("./types").AddJoke} AddJoke */
/** @typedef {import("./types").Keypress} Keypress */
/** @typedef {import("../src/types/jokes").Joke} Joke */
/** @typedef {import("../src/types/jokes").JokeSubmission} JokeSubmission */


//#MARKER init

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
    exitError(err);
}

/**
 * Prints an error and instantly queues exit with status 1 (all async tasks are immediately canceled)
 * @param {Error} err
 */
function exitError(err)
{
    if(!(err instanceof Error))
    {
        console.error(`\n${col.red}${err.toString()}${col.rst}\n`);
        exit(1);
    }

    const stackLines = err.stack.toString().split(/\n/g);
    stackLines.shift();
    const stackStr = stackLines.join("\n");
    console.error(`\n${col.red}${err.message.match(/(E|e)rror/) ? "" : "Error: "}${err.message}${col.rst}\n${stackStr}\n`);

    exit(1);
}

/**
 * Runs this tool
 * @param {AddJoke} [incompleteJoke]
 */
async function run(incompleteJoke = undefined)
{
    try
    {
        if(!data.initialized)
            await init();

        data.initialized = true;

        const joke = await promptJoke(incompleteJoke);

        await addJoke(joke);

        blankLine();

        const { another } = await prompt({
            type: "confirm",
            message: "Add another joke?",
            name: "another",
            initial: false,
        });

        if(another)
        {
            blankLine(2);
            return run();
        }

        blankLine();

        exit(0);
    }
    catch(err)
    {
        exitError(err);
    }
}

/**
 * Initializes the add-joke script
 * @returns {Promise<void, Error>}
 */
function init()
{
    return new Promise(async (res, rej) => {
        try
        {
            await languages.init();

            await translate.init();

            await parseJokes.init();

            return res();
        }
        catch(err)
        {
            const e = new Error(`Couldn't initialize: ${err.message}`).stack += err.stack;
            return rej(e);
        }
    });
}

//#MARKER prompts

/**
 * Prompts the user to enter all joke properties
 * @param {Joke} currentJoke
 * @returns {Promise<Joke, Error>}
 */
function promptJoke(currentJoke)
{
    return new Promise(async (res, rej) => {
        try
        {
            if(!currentJoke)
                currentJoke = createEmptyJoke();

            /**
             * Makes a title for the prompt below
             * @param {string} propName Name of the property (case sensitive)
             * @param {string} curProp The current value of the property to display
             * @returns {string}
             */
            const makeTitle = (propName, curProp) => {
                const truncateLength = 64;
                
                if(typeof curProp === "string" && curProp.length > truncateLength)
                    curProp = `${curProp.substr(0, truncateLength)}…`;

                const boolDeco = typeof curProp === "boolean" ? (curProp === true ? ` ${col.green}✔ ` : ` ${col.red}✘ `) : "";

                const propCol = curProp != null ? col.green : col.magenta;

                return `${propName}${col.rst} ${propCol}(${col.rst}${curProp}${col.rst}${boolDeco}${propCol})${col.rst}`;
            };

            const jokeChoices = currentJoke.type === "single" ? [
                {
                    title: makeTitle("Joke", currentJoke.joke),
                    value: "joke",
                },
            ] : [
                {
                    title: makeTitle("Setup", currentJoke.setup),
                    value: "setup",
                },
                {
                    title: makeTitle("Delivery", currentJoke.delivery),
                    value: "delivery",
                },
            ];

            const choices = [
                {
                    title: makeTitle("Category", currentJoke.category),
                    value: "category",
                },
                {
                    title: makeTitle("Type", currentJoke.type),
                    value: "type",
                },
                ...jokeChoices,
                {
                    title: makeTitle("Flags", extractFlags(currentJoke)),
                    value: "flags",
                },
                {
                    title: makeTitle("Language", currentJoke.lang),
                    value: "lang",
                },
                {
                    title: makeTitle("Safe", currentJoke.safe),
                    value: "safe",
                },
                {
                    title: `${col.green}[Submit]${col.rst}`,
                    value: "submit",
                },
                {
                    title: `${col.red}[Exit]${col.rst}`,
                    value: "exit",
                },
            ];

            process.stdout.write("\n");

            const { editProperty } = await prompt({
                message: "Edit new joke's properties",
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
                    message: "Select new category",
                    name: "category",
                    choices: catChoices,
                    initial: settings.jokes.possible.categories.indexOf("Misc"),
                });

                currentJoke.category = category;
                break;
            }
            case "joke":
            case "setup":
            case "delivery":
                currentJoke[editProperty] = (await prompt({
                    type: "text",
                    message: `Enter value for '${editProperty}' property`,
                    name: "val",
                    initial: currentJoke[editProperty] || "",
                    validate: (val) => (!isEmpty(val) && val.length >= settings.jokes.submissions.minLength),
                })).val;
                break;
            case "type":
                currentJoke.type = (await prompt({
                    type: "select",
                    message: "Select a joke type",
                    choices: [
                        { title: "Single", value: "single" },
                        { title: "Two Part", value: "twopart" },
                    ],
                    name: "type",
                })).type;
                break;
            case "flags":
            {
                const flagKeys = Object.keys(currentJoke.flags);
                const flagChoices = [];

                flagKeys.forEach(key => {
                    flagChoices.push({
                        title: key,
                        selected: currentJoke.flags[key] === true,
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

                Object.keys(currentJoke.flags).forEach(key => {
                    currentJoke.flags[key] = false;
                });

                newFlags.forEach(setFlagIdx => {
                    const key = flagKeys[setFlagIdx];
                    currentJoke.flags[key] = true;
                });

                break;
            }
            case "lang":
                currentJoke.lang = (await prompt({
                    type: "text",
                    message: "Enter joke language",
                    initial: currentJoke.lang,
                    name: "lang",
                    validate: ((val) => languages.isValidLang(val, "en") === true),
                })).lang;
                break;
            case "safe":
                currentJoke.safe = (await prompt({
                    type: "confirm",
                    message: "Is this joke safe?",
                    initial: true,
                    name: "safe",
                })).safe;
                break;
            case "submit":
                return res(currentJoke);
            case "exit":
            {
                const { confirmExit } = await prompt({
                    type: "confirm",
                    message: "Do you really want to exit?",
                    name: "confirmExit",
                    initial: true,
                });

                confirmExit && exit(0);
                break;
            }
            default:
                return exitError(new Error(`Selected invalid option '${editProperty}'`));
            }

            return res(await promptJoke(currentJoke));
        }
        catch(err)
        {
            const e = new Error(`Error while prompting for joke: ${err.message}`).stack += err.stack;
            return rej(e);
        }
    });
}

//#MARKER other

/**
 * Adds a joke to its language file
 * @param {AddJoke} joke
 * @returns {Promise<void, (Error)>}
 */
function addJoke(joke)
{
    return new Promise(async (res, rej) => {
        try
        {
            const initialJoke = reserialize(joke);
            const { lang } = joke;

            const jokeFilePath = join(settings.jokes.jokesFolderPath, `jokes-${lang}.json`);
            const templatePath = join(settings.jokes.jokesFolderPath, settings.jokes.jokesTemplateFile);

            if(!(await filesystem.exists(jokeFilePath)))
                await copyFile(templatePath, jokeFilePath);


            /** @type {JokesFile} */
            const currentJokesFile = JSON.parse((await readFile(jokeFilePath)).toString());
            /** @type {any} */
            const currentJokes = reserialize(currentJokesFile.jokes);

            const lastId = currentJokes[currentJokes.length - 1].id;

            const validationRes = validateSingle(joke, lang);

            // ensure props match and strip extraneous props
            joke.id = lastId + 1;
            joke.lang && delete joke.lang;
            joke.formatVersion && delete joke.formatVersion;

            joke = reformatJoke(joke);

            if(Array.isArray(validationRes))
            {
                console.error(`\n${col.red}Joke is invalid:${col.rst}\n  - ${validationRes.join("\n  - ")}\n`);

                const { retry } = await prompt({
                    type: "confirm",
                    message: "Do you want to retry?",
                    name: "retry",
                    initial: true,
                });

                if(retry)
                    return promptJoke(initialJoke);

                exit(0);
            }
            else
            {
                currentJokes.push(joke);

                currentJokesFile.jokes = currentJokes;

                await writeFile(jokeFilePath, JSON.stringify(currentJokesFile, undefined, 4));

                return res();
            }
        }
        catch(err)
        {
            const e = new Error(`Couldn't save joke: ${err.message}`).stack += err.stack;
            return rej(e);
        }
    });
}

//#SECTION prompt deps

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

//#SECTION other deps

/**
 * Returns a joke where everything is set to a default but empty value
 * @returns {NullableProps<AddJoke>}
 */
function createEmptyJoke()
{
    return {
        formatVersion: 3,
        category: undefined,
        type: "single",
        joke: undefined,
        flags: {
            nsfw: false,
            religious: false,
            political: false,
            racist: false,
            sexist: false,
            explicit: false,
        },
        lang: "en",
        safe: false,
    };
}

/**
 * Inserts a blank line (or more if `amount` is set)
 * @param {number} [amount=1]
 */
function blankLine(amount = 1)
{
    if(typeof amount !== "number" || isNaN(amount))
        throw new TypeError(`Parameter 'amount' is ${isNaN(amount) ? "NaN" : "not of type number"}`);

    let lfChars = "";

    for(let u = 0; u < amount; u++)
        lfChars += "\n";

    process.stdout.write(lfChars);
}
