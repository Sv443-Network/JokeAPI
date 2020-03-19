// this module initializes the blacklist, whitelist and console blacklist

const jsl = require("svjsl");
const farmhash = require("farmhash");
const fs = require("fs");
const settings = require("../settings");
const debug = require("./verboseLogging");
const packageJSON = require("../package.json");
const parseJokes = require("./parseJokes");
const logRequest = require("./logRequest");
const zlib = require("zlib");
const xss = require("xss");
const semver = require("semver");
const analytics = require("./analytics");


/**
 * Initializes the documentation files
 * @returns {Promise}
 */
const init = () => {
    return new Promise((resolve, reject) => {
        try
        {
            process.injectionCounter = 0;
            debug("Docs", "Starting Daemon and recompiling docs files...")
            startDaemon();
            recompileDocs();
            return resolve();
        }
        catch(err)
        {
            return reject(err);
        }
    });
};

/**
 * Starts a daemon in the docs folder that awaits changes and then recompiles the docs
 */
const startDaemon = () => {
    let scanDir = () => {
        fs.readdir(settings.documentation.rawDirPath, (err, files) => {
            if(err) return console.log(`${jsl.colors.fg.red}Daemon got error: ${err}${jsl.colors.rst}\n`);

            let checksum = "";
            files.forEach((file, i) => {
                checksum += (i != 0 && i < files.length ? "-" : "") + farmhash.hash32(fs.readFileSync(`${settings.documentation.rawDirPath}${file}`)).toString();
            });

            process.jokeapi.documentation.newChecksum = checksum;
            if(jsl.isEmpty(process.jokeapi.documentation.oldChecksum))
                process.jokeapi.documentation.oldChecksum = checksum;
            
            if(process.jokeapi.documentation.oldChecksum != process.jokeapi.documentation.newChecksum)
            {
                debug("Daemon", "Noticed changed files");
                logRequest("docsrecompiled");
                recompileDocs();
            }

            process.jokeapi.documentation.oldChecksum = checksum;
        });
    };

    if(jsl.isEmpty(process.jokeapi.documentation))
        process.jokeapi.documentation = {};
    process.jokeapi.documentation.daemonInterval = setInterval(() => scanDir(), settings.documentation.daemonInterval * 1000);

    scanDir();
};

/**
 * Recompiles the documentation page
 */
const recompileDocs = () => {
    debug("Docs", "Recompiling docs...");

    try
    {
        let filesToInject = [
            `${settings.documentation.rawDirPath}index.js`,
            `${settings.documentation.rawDirPath}index.css`,
            `${settings.documentation.rawDirPath}index.html`,
            `${settings.documentation.rawDirPath}errorPage.css`,
            `${settings.documentation.rawDirPath}errorPage.js`
        ];

        let injectedFileNames = [
            `${settings.documentation.compiledPath}index_injected.js`,
            `${settings.documentation.compiledPath}index_injected.css`,
            `${settings.documentation.compiledPath}documentation.html`,
            `${settings.documentation.compiledPath}errorPage_injected.css`,
            `${settings.documentation.compiledPath}errorPage_injected.js`
        ];

        let promises = [];
        
        process.injectionCounter = 0;
        process.injectionTimestamp = new Date().getTime();

        filesToInject.forEach((fti, i) => {
            promises.push(new Promise((resolve, reject) => {
                jsl.unused(reject);
                inject(fti).then((injected, injectionsNum) => {
                    if(!jsl.isEmpty(injectionsNum) && !isNaN(parseInt(injectionsNum)))
                        process.injectionCounter += parseInt(injectionsNum);

                    process.brCompErrOnce = false;

                    if(settings.httpServer.encodings.gzip)
                        saveEncoded("gzip", injectedFileNames[i], injected).catch(err => void(err));
                    if(settings.httpServer.encodings.deflate)
                        saveEncoded("deflate", injectedFileNames[i], injected).catch(err => void(err));
                    if(settings.httpServer.encodings.brotli)
                        saveEncoded("brotli", injectedFileNames[i], injected).catch(() => {
                            if(!process.brCompErrOnce)
                            {
                                process.brCompErrOnce = true;
                                injectError(`Brotli compression is only supported since Node.js version 11.7.0 - current Node.js version is ${semver.clean(process.version)}`, false);
                            }
                        });

                    fs.writeFile(injectedFileNames[i], injected, err => {
                        if(err)
                            injectError(err);

                        return resolve();
                    });
                })
            }));
        });

        Promise.all(promises).then(() => {
            debug("Docs", `Done recompiling docs in ${jsl.colors.fg.yellow}${new Date().getTime() - process.injectionTimestamp}ms${jsl.colors.rst}, injected ${jsl.colors.fg.yellow}${process.injectionCounter}${jsl.colors.rst} values`);
        }).catch(err => {
            console.log(`Injection error: ${err}`);
        });
    }
    catch(err)
    {
        injectError(err);
    }
};

/**
 * Asynchronously encodes a string and saves it encoded with the selected encoding
 * @param {("gzip"|"deflate"|"brotli")} encoding The encoding method
 * @param {String} filePath The path to a file to save the encoded string to - respective file extensions will automatically be added
 * @param {String} content The string to encode
 * @returns {Promise<null|String>} Returns a Promise. Resolve contains no parameters, reject contains error message as a string
 */
const saveEncoded = (encoding, filePath, content) => {
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
                            else return reject(err);
                        });
                    }
                    else return reject(err);
                });
            break;
            case "deflate":
                zlib.deflate(content, (err, res) => {
                    if(!err)
                    {
                        fs.writeFile(`${filePath}.zz`, res, err => {
                            if(!err)
                                return resolve();
                            else return reject(err);
                        });
                    }
                    else return reject(err);
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
                        else return reject(err);
                    });
                }
                else return reject(`Brotli compression is only supported since Node.js version "v11.7.0" - current Node.js version is "${process.version}"`);
            break;
            default:
                return reject(`Encoding method "${encoding}" not found - valid methods are: "gzip", "deflate", "brotli"`);
        }
    });
}

/**
 * Logs an injection error to the console
 * @param {String} err The error message
 * @param {Boolean} [exit=true] Whether or not to exit the process with code 1 - default: true
 */
const injectError = (err, exit = true) => {
    console.log(`\n${jsl.colors.fg.red}Error while injecting docs: ${err}${jsl.colors.rst}\n`);
    analytics({
        type: "Error",
        data: {
            errorMessage: `Error while injecting into documentation: ${err}`,
            ipAddress: `N/A`,
            urlPath: [],
            urlParameters: {}
        }
    })
    if(exit)
        process.exit(1);
}

/**
 * Injects all constants and external files into the passed file
 * @param {String} filePath Path to the file to inject things into
 * @returns {Promise<String, Number>} Returns the finished file content as passed argument in a promise
 */
const inject = filePath => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, file) => {
            if(err)
                return reject(err);

            try
            {
                file = file.toString();

                //#SECTION INSERTs
                let contributors = JSON.stringify(packageJSON.contributors);
                let jokeCount = parseJokes.jokeCount;

                let injections = {
                    "<!--%#INSERT:VERSION#%-->":               settings.info.version,
                    "<!--%#INSERT:NAME#%-->":                  settings.info.name,
                    "<!--%#INSERT:DESC#%-->":                  settings.info.desc,
                    "<!--%#INSERT:AUTHORWEBSITEURL#%-->":      settings.info.author.website,
                    "<!--%#INSERT:AUTHORGITHUBURL#%-->":       settings.info.author.github,
                    "<!--%#INSERT:CONTRIBUTORS#%-->":          (!jsl.isEmpty(contributors) ? contributors : "{}"),
                    "<!--%#INSERT:PROJGITHUBURL#%-->":         settings.info.projGitHub,
                    "<!--%#INSERT:JOKESUBMISSIONURL#%-->":     settings.jokes.jokeSubmissionURL,
                    "<!--%#INSERT:CATEGORYARRAY#%-->":         JSON.stringify([settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories]),
                    "<!--%#INSERT:FLAGSARRAY#%-->":            JSON.stringify(settings.jokes.possible.flags),
                    "<!--%#INSERT:FILEFORMATARRAY#%-->":       JSON.stringify(settings.jokes.possible.formats.map(itm => itm.toUpperCase())),
                    "<!--%#INSERT:TOTALJOKES#%-->":            (!jsl.isEmpty(jokeCount) ? jokeCount.toString() : 0),
                    "<!--%#INSERT:TOTALJOKESZEROINDEXED#%-->": (!jsl.isEmpty(jokeCount) ? (jokeCount - 1).toString() : 0),
                    "<!--%#INSERT:PRIVACYPOLICYURL#%-->":      settings.info.privacyPolicyUrl,
                    "<!--%#INSERT:DOCSURL#%-->":               (!jsl.isEmpty(settings.info.docsURL) ? settings.info.docsURL : "(Error: Documentation URL not defined)"),
                    "<!--%#INSERT:RATELIMITCOUNT#%-->":        settings.httpServer.rateLimiting.toString(),
                    "<!--%#INSERT:FORMATVERSION#%-->":         settings.jokes.jokesFormatVersion.toString(),
                    "<!--%#INSERT:MAXPAYLOADSIZE#%-->":        settings.httpServer.maxPayloadSize.toString(),
                    "<!--%#INSERT:MAXURLLENGTH#%-->":          settings.httpServer.maxUrlLength.toString(),
                };

                let allMatches = 0;
                Object.keys(injections).forEach(key => {
                    let regex = new RegExp(key, "gm");
                    allMatches += ((file.toString().match(regex) || []).length || 0);
                    let injection = sanitize(injections[key]);
                    file = file.replace(regex, !jsl.isEmpty(injection) ? injection : "Error");
                });

                if(isNaN(parseInt(allMatches)))
                    allMatches = 0;
                
                process.injectionCounter += allMatches;
                return resolve(file.toString());
            }
            catch(err)
            {
                return reject(err);
            }
        });
    });
};

/**
 * Sanitizes a string to prevent XSS
 * @param {String} str 
 * @returns {String}
 */
const sanitize = str => {
    return xss(str);
};

/**
 * Removes all line breaks and tab stops from an input string and returns it
 * @param {String} input 
 * @returns {String}
 */
const minify = input => input.toString().replace(/(\n|\r\n|\t)/gm, "");


module.exports = { init, recompileDocs, minify, sanitize };