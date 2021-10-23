const prompt = require("prompts");
const { colors, Errors } = require("svcorelib");

const languages = require("../src/languages");

// const settings = require("../settings");
const { validateSingle } = require("../src/parseJokes");

const col = colors.fg;
const { exit } = process;


/** @typedef {import("tsdef").NullableProps} NullableProps */
/** @typedef {import("./types").AddJoke} AddJoke */
/** @typedef {import("../src/types/jokes").Joke} Joke */
/** @typedef {import("../src/types/jokes").JokeSubmission} JokeSubmission */


async function run()
{
    try
    {
        await init();

        const joke = await promptJoke();

        // await saveJoke(joke);
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
            languages.init();

            return res();
        }
        catch(err)
        {
            const e = new Error(`Couldn't initialize: ${err.message}`).stack += err.stack;
            return rej(e);
        }
    });
}

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
                    title: makeTitle("Flags", extractFlags(currentJoke.joke)),
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
                return res();
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
