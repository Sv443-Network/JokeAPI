// this validates all jokes' IDs. This will be run through the CI to make sure the IDs are correct
// run this with the command "npm run reassign-ids"

const { resolve, join } = require("path");
const fs = require("fs-extra");
const jsl = require("svjsl");
const settings = require("../settings");

const col = { ...jsl.colors.fg, rst: jsl.colors.rst };

/**
 * Exactly what the name suggests
 * @param {string} msg A short message
 * @param {string|Error} err The full error string or object
 */
function exitWithError(msg, err)
{
    console.log(`\n\n\x1b[31m\x1b[1m>> ${msg}:\n${err}\n\n\x1b[0m`);
    process.exit(1);
}

try
{
    console.log(`\nValidating joke IDs in files in "${settings.jokes.jokesFolderPath}"...`);

    let validatedFiles = 0;
    let notOk = 0;

    fs.readdirSync(settings.jokes.jokesFolderPath).forEach(fName => {
        if(fName.startsWith("template"))
            return;

        let langCode = fName.split("-")[1].substr(0, 2);

        let filePath = resolve(join(settings.jokes.jokesFolderPath, fName));

        let jokeFileObj = JSON.parse(fs.readFileSync(filePath).toString());
        let initialJokes = jokeFileObj.jokes;
        let initialInfo = jokeFileObj.info;

        if(initialInfo.formatVersion != settings.jokes.jokesFormatVersion)
            return exitWithError("Error while checking format version", `Format version in file "${filePath}" (version ${initialInfo.formatVersion}) is different from the one being currently used in JokeAPI (${settings.jokes.jokesFormatVersion})`);

        let erroredJokes = [];

        initialJokes.forEach((joke, i) => {
            if(joke.id != i)
                erroredJokes.push({joke: joke, idx: i});
        });

        validatedFiles++;

        if(erroredJokes.length != 0)
        {
            console.log(`\n\n\x1b[31m\x1b[1mInvalid joke ID${erroredJokes.length > 1 ? "s" : ""} found:\x1b[0m\n`);
            console.log(`Format:  #ID | LangCode | Category | Joke    (error)`);
            erroredJokes.forEach(errjoke => {
                let jokeContent = "";
                if(errjoke.joke.type == "single")
                    jokeContent = errjoke.joke.joke.replace(/\n/gm, "\\n");
                else if(errjoke.joke.type == "twopart")
                    jokeContent = `${errjoke.joke.setup.replace(/\n/gm, "\\n")} -/- ${errjoke.joke.delivery.replace(/\n/gm, "\\n")}`;

                if(jokeContent.length > 40)
                    jokeContent = `${jokeContent.substr(0, 40)}...`;

                console.log(`#${errjoke.joke.id} | ${langCode} | ${errjoke.joke.category} | ${jokeContent}    ${col.red}(Expected ID #${errjoke.idx} - joke instead has #${errjoke.joke.id})${col.rst}`);
                notOk++;
            });
        }
    });

    if(notOk > 0)
    {
        console.log(`\n\x1b[33m\x1b[1mYou can run the command "npm run reassign-ids" to correct all joke IDs\n\x1b[0m`);
        process.exit(1);
    }
    else
    {
        console.log(`\x1b[32m\x1b[1mDone validating IDs of all ${validatedFiles} files.\n\x1b[0m`);
        process.exit(0);
    }
}
catch(err)
{
    return exitWithError("General error while validating joke IDs", err);
}
