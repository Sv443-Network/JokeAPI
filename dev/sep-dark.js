const { resolve, join, basename } = require("path");
const { readFile, readdir } = require("fs-extra");
// const { filesystem } = require("svcorelib");
const { statSync } = require("fs");
const promiseAllSeq = require("promise-all-sequential");

// const settings = require("../settings");


/** @typedef {import("../src/types/jokes").Joke} Joke */
/** @typedef {import("../src/types/jokes").JokesFile} JokesFile */
/** @typedef {import("../src/types/jokes").JokesFileInfo} JokesFileInfo */
/** @typedef {import("../src/types/languages").LangCode} LangCode */

/**
 * @typedef {object} JokesFileObj Contains the jokes file and some more info about the file
 * @prop {LangCode} lang Language of the jokes
 * @prop {JokesFile} file Jokes file, represented 1:1 like in the JSON file
 */

/**
 * @typedef {object} NewJokesObj
 * @prop {LangCode} lang
 * @prop {JokesFileInfo} info
 * @prop {Joke[]} regular
 * @prop {Joke[]} dark
 */


/** File paths */
const paths = {
    /** Input directory path that contains all jokes files */
    input: resolve("./data/jokes/"),
    /** Output directory path that will contain the new jokes files with all the dark jokes, that have been extracted from the input files */
    output: resolve("./data/jokes/dark/"),
    /** Path to the jokes file template */
    jokesFileTemplate: resolve("./data/jokes/template.json"),
};

/**
 * @returns {Promise<JokesFileObj[]>}
 */
async function readJokesFiles()
{
    const jokeFileNames = await readdir(paths.input);

    const jokeFilePaths = jokeFileNames.filter(v => !v.startsWith("template")).filter(v => statSync(join(paths.input, v)).isFile());
    
    const filteredPaths = jokeFilePaths.map(n => join(paths.input, n));


    /** @type {(() => Promise<JokesFileObj>)[]} */
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

    /** @type {JokesFileObj[]} */
    const jokesFiles = await promiseAllSeq(readProms);

    return jokesFiles;
}

async function run()
{
    const jokesFiles = await readJokesFiles();

    /** @type {(() => Promise<NewJokesObj>)[]} */
    const extractProms = [];

    jokesFiles.forEach(jokesFile => {
        extractProms.push(() => new Promise(async (res) => {
            const { lang, file } = jokesFile;

            /** @type {NewJokesObj} */
            const newJokes = {
                lang,
                info: file.info,
                /** @type {Joke[]} */
                regular: [],
                /** @type {Joke[]} */
                dark: [],
            };

            console.log(`Extracting dark jokes of lang '${lang}'...`);
            
            file.jokes.forEach(joke => {
                const { category, flags } = joke;

                if(category === "Dark" || flags.racist || flags.sexist)
                    newJokes.dark.push(joke);
                else
                    newJokes.regular.push(joke);
            });

            return res(newJokes);
        }));
    });

    /** @type {NewJokesObj[]} */
    const newJokesFiles = await promiseAllSeq(extractProms);

    console.log("new jokes files", newJokesFiles);
}

(() => run())();
