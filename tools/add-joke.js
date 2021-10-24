const prompt = require("prompts");
const { colors, Errors } = require("svcorelib");

const languages = require("../src/languages");
const { init: trInit  } = require("../src/translate");

// const settings = require("../settings");
const { validateSingle, ValidationError } = require("../src/parseJokes");
const { writeFile } = require("fs-extra");

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
    console.error(`${col.red}${err instanceof Error ? `${err.message}${col.rst}\n${err.stack}` : err.toString().replace(/\n/, `${col.rst}\n`)}${col.rst}\n`);

    exit(1);
}

async function run()
{
    try
    {
        if(!data.initialized)
            await init();

        data.initialized = true;

        const joke = await promptJoke();

        await addJoke(joke);

        blankLine();

        const { another } = await prompt({
            type: "confirm",
            message: "Add another joke?",
            name: "another",
            initial: false,
        });

        if(another)
            return run();

        blankLine();

        exit(0);
    }
    catch(err)
    {
        if(err instanceof ValidationError)
        {
            console.log("err msg:  ", err.message);
            console.log("err props:", err.invalidProps);
            console.log("err date: ", err.date);
            console.log(`err stack:\n${err.stack}`);
        }
        else
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

            await trInit();

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
                const validationRes = validateSingle(currentJoke);
                const valid = !Array.isArray(validationRes);
                const titleCol = valid ? col.red : "";

                return `${titleCol}${propName} (${col.rst}${curProp}${titleCol})${col.rst}`;
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
                message: "Edit property",
                type: "select",
                name: "editProperty",
                hint: "- Use arrow-keys. Return to select. Esc or Ctrl+C to submit.",
                choices,
            });

            switch(editProperty)
            {
            case "category":

                break;
            case "type":

                break;
            case "joke":

                break;
            case "setup":

                break;
            case "delivery":

                break;
            case "flags":

                break;
            case "safe":

                break;
            case "submit":
                return res(currentJoke);
            case "exit":
                exit(0);
                break;
            default:
                return exitError(new Error(`Selected invalid option '${editProperty}'`));
            }

            // TODO:
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
 * @returns {Promise<void, (Error | ValidationError)>} if instance of ValidationError, some properties about validation results are added
 */
function addJoke(joke)
{
    return new Promise(async (res, rej) => {
        try
        {
            const { lang } = joke;

            // TODO:
            // - give ID to joke
            // - validate joke, throw custom ValidationError to enable custom catching behavior
            // - write joke to joke file

            //#DEBUG showing off how ValidationError works:
            let errored = true;

            if(errored)
            {
                const invalidProps = [ "category", "joke" ];
                const err = new ValidationError(`Joke has ${invalidProps.length} invalid properties`);
                err.invalidProps = invalidProps;

                return rej(err);
            }
            else
            {
                await writeFile(`TODO:jokes-${lang}.json`, );

                return res();
            }
        }
        catch(err)
        {
            const e = new Error(`Couldn't add joke: ${err.message}`).stack += err.stack;
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
        category: null,
        type: "single",
        joke: null,
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
    if(typeof amount !== "number")
        throw new TypeError(`Parameter 'amount' is ${isNaN(amount) ? "NaN" : "not of type number"}`);

    let lfChars = "";

    for(let u = 0; u < amount; u++)
        lfChars += "\n";

    process.stdout.write(lfChars);
}
