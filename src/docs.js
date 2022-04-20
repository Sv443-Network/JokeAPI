// this module initializes the blacklist, whitelist and console blacklist

const { isEmpty, unused, FolderDaemon, colors } = require("svcorelib");
const fs = require("fs-extra");
const zlib = require("zlib");
const xss = require("xss");
const semver = require("semver");
const path = require("path");

const debug = require("./debug");
const packageJSON = require("../package.json");
const parseJokes = require("./parseJokes");
const logRequest = require("./logRequest");
const analytics = require("./analytics");
const languages = require("./languages");
const { getAllSplashes } = require("./splashes");
const { getCommit } = require("./env");

const settings = require("../settings");


/** @typedef {import("./types/docs").EncodingName} EncodingName */
/** @typedef {import("./types/env").CommitInfo} CommitInfo */


/** Data that persists throughout the entire execution */
const persistentData = {
    /** Tracks how many values are inserted into the docs at compilation */
    injectionCounter: 0,
    /** Tracks the timestamp of when the last compilation was started */
    injectionTimestamp: 0,
    /** Is used to ensure a Brotli error is only thrown once */
    brCompErrOnce: false,
    /** Tracks whether or not a docs compilation is the initial one or one triggered through the daemon */
    isInitialCompilation: true,
    /** @type {CommitInfo} Current git commit */
    curCommit: undefined,
};


/**
 * Initializes the documentation files
 * @returns {Promise<void, string>}
 */
function init()
{
    return new Promise(async (resolve, reject) => {
        try
        {
            persistentData.curCommit = await getCommit();

            persistentData.injectionCounter = 0;
            debug("Docs", "Starting daemon and recompiling documentation files...");
        
            startDaemon();

            // initial compilation of docs
            await compileDocs();

            return resolve();
        }
        catch(err)
        {
            return reject(err);
        }
    });
}

/**
 * Starts a daemon in the docs folder that awaits changes and then recompiles the docs
 */
function startDaemon()
{
    let fd = new FolderDaemon(path.resolve(settings.documentation.rawDirPath), [], true, settings.documentation.daemonInterval * 1000);
    fd.onChanged((error, result) => {
        unused(result);
        if(!error)
        {
            debug("Daemon", "Noticed changed files");
            logRequest("docsrecompiled");
            // no need to wait for promise
            compileDocs();
        }
    });
}

/**
 * Compiles the documentation page
 * @returns {Promise<undefined|string>} Promise never rejects, it always resolves to undefined if successful or an error string
 */
function compileDocs()
{
    return new Promise(async recompRes => {
        if(persistentData.isInitialCompilation)
            debug("Docs", "Starting initial docs compilation...");
        else
            debug("Docs", "Recompiling docs...");

        try
        {
            const filesToInject = [
                `${settings.documentation.rawDirPath}index.js`,
                `${settings.documentation.rawDirPath}index.css`,
                `${settings.documentation.rawDirPath}index.html`,
                `${settings.documentation.rawDirPath}errorPage.css`,
                `${settings.documentation.rawDirPath}errorPage.js`,
            ];

            const injectedFileNames = [
                `${settings.documentation.compiledPath}index_injected.js`,
                `${settings.documentation.compiledPath}index_injected.css`,
                `${settings.documentation.compiledPath}documentation.html`,
                `${settings.documentation.compiledPath}errorPage_injected.css`,
                `${settings.documentation.compiledPath}errorPage_injected.js`,
            ];

            const promises = [];

            persistentData.injectionCounter = 0;
            persistentData.injectionTimestamp = Date.now();

            filesToInject.forEach((fileToInject, i) => {
                promises.push(new Promise((resolve, reject) => {
                    unused(reject);
                    inject(fileToInject).then((injected, injectionsNum) => {
                        if(!isEmpty(injectionsNum) && !isNaN(parseInt(injectionsNum)))
                            persistentData.injectionCounter += parseInt(injectionsNum);

                        persistentData.brCompErrOnce = false;

                        if(settings.httpServer.encodings.gzip)
                            saveEncoded("gzip", injectedFileNames[i], injected).catch(err => unused(err));
                        if(settings.httpServer.encodings.deflate)
                            saveEncoded("deflate", injectedFileNames[i], injected).catch(err => unused(err));
                        if(settings.httpServer.encodings.brotli)
                        {
                            saveEncoded("brotli", injectedFileNames[i], injected).catch(err => {
                                unused(err);

                                if(!persistentData.brCompErrOnce)
                                {
                                    persistentData.brCompErrOnce = true;
                                    injectError(`Brotli compression is only supported since Node.js version 11.7.0 - current Node.js version is ${semver.clean(process.version)}\nError: ${err}`, false);
                                }
                            });
                        }

                        fs.writeFile(injectedFileNames[i], injected, err => {
                            if(err)
                                injectError(err);

                            return resolve();
                        });
                    });
                }));
            });

            try
            {
                await Promise.allSettled(promises);

                const infoStr = `${colors.fg.yellow}${Date.now() - persistentData.injectionTimestamp}ms${colors.rst} (injected ${colors.fg.yellow}${persistentData.injectionCounter}${colors.rst} values)`;

                if(persistentData.isInitialCompilation)
                {
                    debug("Docs", `Done with initial docs compilation after ${infoStr}`, "green");
                    persistentData.isInitialCompilation = false;
                }
                else
                    debug("Docs", `Docs recompiled after ${infoStr}`, "green");

                return recompRes();
            }
            catch(err)
            {
                injectError(err);

                return recompRes(err);
            }
        }
        catch(err)
        {
            injectError(err);

            return recompRes(err);
        }
    });
}

/**
 * Asynchronously encodes a string and saves it to disk
 * @param {EncodingName} encoding The encoding name
 * @param {string} filePath The path to a file to save the encoded string to - respective file extensions will automatically be added
 * @param {string} content The string to encode and save to the file at `filePath`
 * @returns {Promise<void, string>} Promise resolves void, rejects with an error message
 */
function saveEncoded(encoding, filePath, content)
{
    return new Promise((resolve, reject) => {
        switch(encoding)
        {
        case "gzip":
            zlib.gzip(content, (err, res) => {
                if(!err)
                {
                    fs.writeFile(`${filePath}.gz`, res, err => {
                        if(!err)
                            return resolve();
                        else
                            return reject(err);
                    });
                }
                else
                    return reject(err);
            });
            break;
        case "deflate":
            zlib.deflate(content, (err, res) => {
                if(!err)
                {
                    fs.writeFile(`${filePath}.zz`, res, err => {
                        if(!err)
                            return resolve();
                        else
                            return reject(err);
                    });
                }
                else
                    return reject(err);
            });
            break;
        case "brotli":
            if(!semver.lt(process.version, "v11.7.0")) // Brotli was added in Node v11.7.0
            {
                zlib.brotliCompress(content, (err, res) => {
                    if(!err)
                    {
                        fs.writeFile(`${filePath}.br`, res, err => {
                            if(!err)
                                return resolve();
                            else return reject(err);
                        });
                    }
                    else
                        return reject(err);
                });
            }
            else
                return reject(`Brotli compression is only supported since Node.js version "v11.7.0" - current Node.js version is "${process.version}"`);
            break;
        default:
            return reject(`Encoding "${encoding}" not found - valid methods are: "gzip", "deflate", "brotli"`);
        }
    });
}

/**
 * Logs an injection error to the console
 * @param {string} err The error message
 * @param {boolean} [exit=true] Whether or not to exit the process with code 1 - default: true
 */
function injectError(err, exit = true)
{
    console.log(`\n${colors.fg.red}Error while injecting values into docs: ${err}${colors.rst}\n`);

    analytics({
        type: "Error",
        data: {
            errorMessage: `Error while injecting into documentation: ${err}`,
            ipAddress: "N/A",
            urlPath: [],
            urlParameters: {},
        },
    });

    exit === true && process.exit(1);
}

/**
 * Injects all constants, external files and values into the passed file
 * @param {string} filePath Path to the file to inject things into
 * @returns {Promise<string, string>} Resolves with the finished file content or rejects with an error string
 */
function inject(filePath)
{
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, file) => {
            if(err)
                return reject(err);

            try
            {
                file = file.toString();

                //#SECTION INSERTs
                const contributors = JSON.stringify(packageJSON.contributors);
                const jokeCount = parseJokes.jokeCount;

                /** Contains key-value pairs of injection / insertion keys and their values */
                const injections = {
                    "%#INSERT:VERSION#%":                settings.info.version,
                    "%#INSERT:NAME#%":                   settings.info.name.toString(),
                    "%#INSERT:DESC#%":                   settings.info.desc.toString(),
                    "%#INSERT:AUTHORWEBSITEURL#%":       settings.info.author.website.toString(),
                    "%#INSERT:AUTHORGITHUBURL#%":        settings.info.author.github.toString(),
                    "%#INSERT:CONTRIBUTORS#%":           (contributors || "{}"),
                    "%#INSERT:CONTRIBUTORGUIDEURL#%":    settings.info.contribGuideUrl.toString(),
                    "%#INSERT:PROJGITHUBURL#%":          settings.info.projGitHub.toString(),
                    "%#INSERT:JOKESUBMISSIONURL#%":      settings.jokes.jokeSubmissionURL.toString(),
                    "%#INSERT:CATEGORYARRAY#%":          JSON.stringify([settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories]),
                    "%#INSERT:FLAGSARRAY#%":             JSON.stringify(settings.jokes.possible.flags),
                    "%#INSERT:FILEFORMATARRAY#%":        JSON.stringify(settings.jokes.possible.formats.map(itm => itm.toUpperCase())),
                    "%#INSERT:TOTALJOKES#%":             (jokeCount ? jokeCount.toString() : 0),
                    "%#INSERT:TOTALJOKESZEROINDEXED#%":  (jokeCount ? (jokeCount - 1).toString() : 0),
                    "%#INSERT:PRIVACYPOLICYURL#%":       settings.info.privacyPolicyUrl.toString(),
                    "%#INSERT:DOCSURL#%":                (settings.info.docsURL || "(Error: Documentation URL not defined)"),
                    "%#INSERT:RATELIMITCOUNT#%":         settings.httpServer.rateLimiting.toString(),
                    "%#INSERT:FORMATVERSION#%":          settings.jokes.jokesFormatVersion.toString(),
                    "%#INSERT:MAXPAYLOADSIZE#%":         settings.httpServer.maxPayloadSize.toString(),
                    "%#INSERT:MAXURLLENGTH#%":           settings.httpServer.maxUrlLength.toString(),
                    "%#INSERT:JOKELANGCOUNT#%":          languages.jokeLangs().length.toString(),
                    "%#INSERT:SYSLANGCOUNT#%":           languages.systemLangs().length.toString(),
                    "%#INSERT:MAXJOKEAMOUNT#%":          settings.jokes.maxAmount.toString(),
                    "%#INSERT:SUBMISSIONRATELIMIT#%":    settings.jokes.submissions.rateLimiting.toString(),
                    "%#INSERT:CATEGORYALIASES#%":        JSON.stringify(settings.jokes.possible.categoryAliases),
                    "%#INSERT:LASTMODIFIEDISO#%":        new Date().toISOString().trim(),
                    "%#INSERT:CACHINGDATAEXPIRYHOURS#%": settings.jokeCaching.expiryHours.toString(),
                    "%#INSERT:SEARCHSTRWILDCARDLIMIT#%": settings.jokes.regexRepetitionLimit.toString(),
                    "%#INSERT:DEFAULTLANGCODE#%":        settings.languages.defaultLanguage.toString(),
                    "%#INSERT:SPLASHESOBJ#%":            Buffer.from(JSON.stringify(getAllSplashes()), "utf8").toString("base64"),
                    "%#INSERT:CACHEMINJOKESAMOUNT#%":    (settings.jokes.maxAmount * settings.jokeCaching.poolSizeDivisor).toString(),
                    "%#INSERT:COMMITSHA#%":              persistentData.curCommit.shortHash,
                };

                const checkMatch = (key, regex) => {
                    allMatches += ((file.toString().match(regex) || []).length || 0);
                    const injection = sanitize(injections[key]);
                    file = file.replace(regex, !isEmpty(injection) ? injection : "<Error>");
                };

                let allMatches = 0;
                Object.keys(injections).forEach(key => {
                    checkMatch(key, new RegExp(`<${key}>`, "gm"));      // style: <%#INSERT:XY#%>
                    checkMatch(key, new RegExp(`<!--${key}-->`, "gm")); // style: <!--%#INSERT:XY#%-->
                });

                if(isNaN(parseInt(allMatches)))
                    allMatches = 0;

                persistentData.injectionCounter += allMatches;
                return resolve(file.toString());
            }
            catch(err)
            {
                return reject(err);
            }
        });
    });
}

/**
 * Sanitizes a string to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function sanitize(str)
{
    return xss(str);
}

/**
 * Removes all line breaks and tab stops from an input string and returns it
 * @param {string} input
 * @returns {string}
 */
function trimString(input)
{
    return input.toString().replace(/(\n|\t)/gm, "");
}


module.exports = { init, compileDocs, trimString, sanitize };
