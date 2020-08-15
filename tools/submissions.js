const settings = require("../settings");
const fs = require("fs-extra");
const { resolve, join } = require("path");
const jsl = require("svjsl");
const parseJokes = require("../src/parseJokes");
const jokeSubmission = require("../src/jokeSubmission");
jsl.unused(parseJokes);

let addedCount = 0;
let jokesFiles = getAllJokes();


const run = () => {
    let submissions = getSubmissions();

    console.log(`${jsl.colors.fg.cyan}There ${submissions.length == 1 ? "is" : "are"} ${jsl.colors.fg.yellow}${submissions.length}${jsl.colors.fg.cyan} submission${submissions.length == 1 ? "" : "s"}.${jsl.colors.rst}`);
    if(submissions.length === 0)
    {
        console.log("Exiting.");
        return process.exit(0);
    }

    jsl.pause(`Do you want to go through them all now? (Y/n):${jsl.colors.rst}`).then(key => {
        if(key.toLowerCase && key.toLowerCase() == "n")
            process.exit(0);
        else
        {
            console.clear();

            let goThroughSubmission = (idx) => {

                if(!submissions[idx])
                    return finishAdding();

                let submission = submissions[idx];

                console.log(`${jsl.colors.fg.yellow}Submission ${idx + 1} / ${submissions.length}${jsl.colors.rst}\n`);

                if(submission.formatVersion != settings.jokes.jokesFormatVersion)
                    console.error(`${jsl.colors.fg.red}Error: Format version is incorrect${jsl.colors.rst}`);
                
                console.log(`${jsl.colors.fg.yellow}Language:${jsl.colors.rst}  ${submission.lang}`);

                if(submission.type == "single")
                {
                    console.log(`${jsl.colors.fg.yellow}Joke:${jsl.colors.rst}      ${submission.joke}`);
                    console.log(`${jsl.colors.fg.yellow}Category:${jsl.colors.rst}  ${submission.category}`);
                    console.log(`${jsl.colors.fg.yellow}Flags:${jsl.colors.rst}     ${getFlags(submission)}`);
                }
                else if(submission.type == "twopart")
                {
                    console.log(`${jsl.colors.fg.yellow}Setup:${jsl.colors.rst}     ${submission.setup}`);
                    console.log(`${jsl.colors.fg.yellow}Delivery:${jsl.colors.rst}  ${submission.delivery}`);
                    console.log(`${jsl.colors.fg.yellow}Category:${jsl.colors.rst}  ${submission.category}`);
                    console.log(`${jsl.colors.fg.yellow}Flags:${jsl.colors.rst}     ${getFlags(submission)}`);
                }
                else console.error(`${jsl.colors.fg.red}Error: Unsuppoted joke type "${submission.type}"${jsl.colors.rst}`);

                jsl.pause("Do you want to add this joke? (y/N):").then(key => {
                    if(key.toLowerCase() === "y")
                    {
                        addJoke(submissions[idx]);
                        process.stdout.write(`${jsl.colors.fg.green}Adding joke.${jsl.colors.rst}\n\n\n\n`);
                    }
                    else process.stdout.write(`${jsl.colors.fg.red}Not adding joke.${jsl.colors.rst}\n\n\n\n`);

                    goThroughSubmission(++idx);
                });
            };

            goThroughSubmission(0);
        }
    }).catch(err => {
        console.error(`Error: ${err}`);
        process.exit(1);
    });
};

/**
 * @typedef {Object} AllJokesObj
 * @prop {Object} [en]
 * @prop {Object} en.info
 * @prop {String} en.info.formatVersion
 * @prop {Array<parseJokes.SingleJoke>|Array<parseJokes.TwopartJoke>} en.jokes
 */

/**
 * Reads the jokes files and returns it as an object
 * @returns {AllJokesObj}
 */
function getAllJokes()
{
    let retObj = {};
    fs.readdirSync(settings.jokes.jokesFolderPath).forEach(jokesFile => {
        if(jokesFile.startsWith("template"))
            return;

        let langCode = jokesFile.split("-")[1].substr(0, 2);
        let filePath = resolve(join(settings.jokes.jokesFolderPath, jokesFile));

        retObj[langCode] = JSON.parse(fs.readFileSync(filePath).toString());
    });

    return retObj;
}

/**
 * Adds a joke to the `jokesFile` object
 * @param {Object} joke 
 */
const addJoke = joke => {
    let fJoke = JSON.parse(JSON.stringify(joke)); // reserialize because call by reference :(

    delete fJoke.formatVersion;
    delete fJoke.lang;

    // jokesFile.jokes.push(fJoke);
    if(!jokesFiles[joke.lang])
        jokesFiles[joke.lang] = JSON.parse(fs.readFileSync(resolve(join(settings.jokes.jokesFolderPath, settings.jokes.jokesTemplateFile))).toString());

    Object.keys(jokesFiles).forEach(langCode => {
        if(joke.lang == langCode)
        {
            jokesFiles[langCode].jokes.push(jokeSubmission.reformatJoke(fJoke));
            addedCount++;
        }
    });
};

/**
 * Writes the `jokesFiles` object to the jokes file
 */
const finishAdding = () => {
    Object.keys(jokesFiles).forEach(langCode => {
        fs.writeFileSync(resolve(join(settings.jokes.jokesFolderPath, `jokes-${langCode}.json`)), JSON.stringify(jokesFiles[langCode], null, 4));
    });

    jsl.pause(`Delete all submissions? (Y/n):`).then(val => {
        if(val.toLowerCase() != "n")
        {
            fs.readdirSync(settings.jokes.jokeSubmissionPath).forEach(folder => {
                fs.removeSync(join(settings.jokes.jokeSubmissionPath, folder));
            });
        }

        console.log(`${jsl.colors.fg.green}Successfully added ${jsl.colors.fg.yellow}${addedCount}${jsl.colors.fg.green} joke${addedCount != 1 ? "s" : ""}${jsl.colors.rst}.\nExiting.\n\n`);
        return process.exit(0);
    });
};

/**
 * Returns the flags of a joke as a string
 * @param {Object} joke 
 * @returns {String}
 */
const getFlags = joke => {
    let flags = [];

    Object.keys(joke.flags).forEach(key => {
        if(joke.flags[key] === true)
            flags.push(key);
    });

    if(flags.length == 0)
        return "(none)";

    return jsl.readableArray(flags);
};

/**
 * Reads all joke submission files and returns them as an array of objects
 * @returns {Array<Object>}
 */
const getSubmissions = () => {
    let submissions = [];
    fs.readdirSync(settings.jokes.jokeSubmissionPath).forEach(lang => {
        fs.readdirSync(resolve(join(settings.jokes.jokeSubmissionPath, lang))).forEach(file => {
            submissions.push(JSON.parse(fs.readFileSync(resolve(`${settings.jokes.jokeSubmissionPath}/${lang}/${file}`)).toString()));
        });
    });
    return submissions;
};

if(!process.stdin.isTTY)
{
    console.log(`${jsl.colors.fg.red}Error: process doesn't have a stdin to read from${jsl.colors.rst}`);
    process.exit(1);
}
else run();
