const settings = require("../settings");
const fs = require("fs");
const jsl = require("svjsl");

let addedCount = 0;
let jokesFile = getAllJokes();

const run = () => {
    let submissions = getSubmissions();

    console.log(`${jsl.colors.fg.cyan}There ${submissions.length == 1 ? "is" : "are"} ${jsl.colors.fg.yellow}${submissions.length}${jsl.colors.fg.cyan} submission${submissions.length == 1 ? "" : "s"}.${jsl.colors.rst}`);
    if(submissions.length === 0)
    {
        console.log("Exiting.");
        return process.exit(0);
    }

    pause(`Do you want to go through them all now? (Y/n):${jsl.colors.rst}`).then(key => {
        if(key.toLowerCase && key.toLowerCase() == "n")
            process.exit(0);
        else
        {
            console.clear();

            let goThroughSubmission = (idx) => {

                if(!submissions[idx])
                {
                    finishAdding();
                    console.log(`Successfully added ${addedCount} joke${addedCount != 1 ? "s" : ""}\nExiting.\n`);
                    return process.exit(0);
                }

                let submission = submissions[idx];

                if(submission.formatVersion != settings.jokes.jokesFormatVersion)
                    console.error(`${jsl.colors.fg.red}Error: Format version is incorrect${jsl.colors.rst}`);
                
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

                pause("Do you want to add this joke? (y/N):").then(key => {
                    if(key.toLowerCase() === "y")
                        addJoke(submissions[idx], jokesFile);

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
 * Reads the jokes file and returns it as an object
 * @returns {Object}
 */
const getAllJokes = () => {
    return JSON.parse(fs.readFileSync(settings.jokes.jokesFilePath).toString());
};

/**
 * Adds a joke to the `jokesFile` object
 * @param {Object} joke 
 */
const addJoke = joke => {
    let fJoke = new Object(joke);

    delete fJoke.formatVersion;

    jokesFile.jokes.push(fJoke);
    addedCount++;
};

/**
 * Writes the `jokesFile` object to the jokes file 
 */
const finishAdding = () => {
    fs.writeFileSync(settings.jokes.jokesFilePath, JSON.stringify(jokesFile, null, 4));
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
        return "";

    return jsl.readableArray(flags);
};

/**
 * Reads all joke submission files and returns them as an array of objects
 * @returns {Array<Object>}
 */
const getSubmissions = () => {
    let submissions = [];
    fs.readdirSync(settings.jokes.jokeSubmissionPath).forEach(file => {
        submissions.push(JSON.parse(fs.readFileSync(`${settings.jokes.jokeSubmissionPath}/${file}`).toString()));
    });
    return submissions;
};

/**
 * Waits for the user to press a key and then resolves a Promise
 * @param {String} text The text to display
 * @returns {Promise} Passes the pressed key in the resolution or the error message in the rejection
 */
function pause(text = "Press any key to continue...")
{
    if(!process.stdin.isRaw)
        process.stdin.setRawMode(true);

    return new Promise((resolve, reject) => {
        process.stdout.write(`${text} `);
        process.stdin.resume();

        let onData = function(chunk)
        {
            process.stdout.write("\n");
            process.stdin.pause();

            process.stdin.removeListener("data", onData);
            return resolve(chunk.toString());
        }

        process.stdin.on("data", onData);

        process.stdin.on("error", err => {
            return reject(err);
        });
    });
}

run();