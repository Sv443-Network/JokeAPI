const { Errors, colors, allOfType } = require("svcorelib");

const { getEnv } = require("../src/env");

const settings = require("../settings");

const col = colors.fg;
const { exit } = process;


async function run()
{
    try
    {
        const { jokes, subm } = getInfo("submissions");

        /** Decorates a value with colors and other stuff */
        const v = val => {
            return `${Array.isArray(val) ? `(${val.length}) ` : ""}${col.green}${Array.isArray(val) && allOfType(val, "string") ? val.join(", ") : val}${col.rst}`;
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
        console.log(`\n${col.red}Error while displaying info:${col.rst}\n${err}\n`);
        exit(1);
    }
}

/**
 * Returns all information about JokeAPI
 */
function getInfo()
{
    // mockup
    return {
        jokes: {
            totalAmt: 420,
            languages: [ "en", "de", "fr", "pt" ],
        },
        subm: {
            amount: 69,
            languages: [ "en", "de" ],
        }
    }
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
