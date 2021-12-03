const { resolve, join, basename } = require("path");
const { readFile, readdir } = require("fs-extra");
const { statSync } = require("fs");
const promiseAllSeq = require("promise-all-sequential");


/** @typedef {import("./src/types/jokes").JokesFile} JokesFile */
/** @typedef {import("./src/types/languages").LangCode} LangCode */

/**
 * @typedef {object} JokeFileObj
 * @prop {JokesFile} file
 * @prop {LangCode} lang
 */


const paths = {
    input: resolve("./data/jokes/"),
    output: resolve("./data/jokes/dark/"),
};

/**
 * @returns {Promise<JokeFileObj[]>}
 */
async function readJokeFiles()
{
    const jokeFileNames = await readdir(paths.input);

    const jokeFilePaths = jokeFileNames.filter(v => !v.startsWith("template")).filter(v => statSync(join(paths.input, v)).isFile());
    
    const filteredPaths = jokeFilePaths.map(n => join(paths.input, n));


    /** @type {(() => Promise<JokeFileObj>)[]} */
    const readProms = [];

    filteredPaths.forEach((path) => {
        readProms.push(() => new Promise(async (res) => {
            const fileName = basename(path);
            const lang = fileName.split("-")[1].substr(0, 2);

            console.log(`Lang: ${lang}`);

            const contRaw = await readFile(path);
            /** @type {JokesFile} */
            const file = JSON.parse(contRaw.toString());

            return res({ file, lang });
        }));
    });

    /** @type {JokeFileObj[]} */
    const jokeFiles = await promiseAllSeq(readProms);

    return jokeFiles;
}

async function run()
{
    const jokeFiles = await readJokeFiles();

    console.log(jokeFiles);
}

(() => run())();
