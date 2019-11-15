// this module initializes the blacklist, whitelist and console blacklist

const jsl = require("svjsl");
const farmhash = require("farmhash");
const fs = require("fs");
const settings = require("../settings");
const debug = require("./verboseLogging");
const packageJSON = require("../package.json");
const parseJokes = require("./parseJokes");
const logRequest = require("./logRequest");


/**
 * Initializes the documentation files
 * @returns {Promise}
 */
const init = () => {
    return new Promise((resolve, reject) => {
        try
        {
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

    let recompileDocsInitTimestamp = new Date().getTime();
    try
    {
        //#SECTION inject JS
        inject(`${settings.documentation.rawDirPath}index.js`).then(injected_js => {
            fs.writeFile(`${settings.documentation.dirPath}index_injected.js`, injected_js, err => {
                if(err) injectError(err);
                //#SECTION inject CSS
                inject(`${settings.documentation.rawDirPath}index.css`).then(injected_css => {
                    fs.writeFile(`${settings.documentation.dirPath}index_injected.css`, injected_css, err => {
                        if(err) injectError(err);
                        //#SECTION inject HTML
                        inject(`${settings.documentation.rawDirPath}index.html`).then(injected_html => {
                            fs.writeFile(`${settings.documentation.dirPath}documentation.html`, injected_html, err => {
                                if(err) injectError(err);
                                let recompileDocsTime = new Date().getTime() - recompileDocsInitTimestamp;
                                debug("Docs", `Done recompiling docs in ${recompileDocsTime}ms`);
                            });
                        }).catch(err => injectError(err));
                    });
                }).catch(err => injectError(err));
            });
        }).catch(err => injectError(err));
    }
    catch(err)
    {
        injectError(err);
    }
};

const injectError = err => {
    console.log(`${jsl.colors.fg.red}Error while injecting docs: ${err}${jsl.colors.rst}`);
    process.exit(1);
}

/**
 * Injects all constants and external files into the passed file
 * @param {String} filePath Path to the file to inject things into
 * @returns {Promise<String>} Returns the done file as a passed argument in a promise
 */
const inject = filePath => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, file) => {
            if(err)
                reject(err);

            try
            {
                file = file.toString();

                //#SECTION INJECTs
                if(fs.existsSync(`${settings.documentation.dirPath}index_injected.js`) && fs.existsSync(`${settings.documentation.dirPath}index_injected.css`))
                {
                    file = file.replace(/<!--%#INJECT:SCRIPT#%-->/gm, `<script>${minify(fs.readFileSync(`${settings.documentation.dirPath}index_injected.js`))}</script>`);
                    file = file.replace(/<!--%#INJECT:STYLESHEET#%-->/gm, `<style>${minify(fs.readFileSync(`${settings.documentation.dirPath}index_injected.css`))}</style>`);
                }

                //#SECTION INSERTs
                let contributors = JSON.stringify(packageJSON.contributors);
                let jokeCount = parseJokes.jokeCount;

                let injections = {
                    "<!--%#INSERT:VERSION#%-->":           settings.info.version,
                    "<!--%#INSERT:NAME#%-->":              settings.info.name,
                    "<!--%#INSERT:DESC#%-->":              settings.info.desc,
                    "<!--%#INSERT:AUTHORWEBSITEURL#%-->":  settings.info.author.website,
                    "<!--%#INSERT:AUTHORGITHUBURL#%-->":   settings.info.author.github,
                    "<!--%#INSERT:CONTRIBUTORS#%-->":      (!jsl.isEmpty(contributors) ? contributors : "{}"),
                    "<!--%#INSERT:PROJGITHUBURL#%-->":     settings.info.projGitHub,
                    "<!--%#INSERT:JOKESUBMISSIONURL#%-->": settings.jokes.jokeSubmissionURL,
                    "<!--%#INSERT:CATEGORYARRAY#%-->":     JSON.stringify([settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories]),
                    "<!--%#INSERT:FLAGSARRAY#%-->":        JSON.stringify(settings.jokes.possible.flags),
                    "<!--%#INSERT:FILEFORMATARRAY#%-->":   JSON.stringify(settings.jokes.possible.formats),
                    "<!--%#INSERT:TOTALJOKES#%-->":        (!jsl.isEmpty(jokeCount) ? jokeCount.toString() : "N/A")
                };

                Object.keys(injections).forEach(key => {
                    let injection = injections[key];
                    file = file.replace(new RegExp(key, "gm"), !jsl.isEmpty(injection) ? injection : "Error");
                });

                resolve(file.toString());
            }
            catch(err)
            {
                reject(err);
            }
        });
    });
};

/**
 * Removes all line breaks and tab stops from an input string and returns it
 * @param {String} input 
 * @returns {String}
 */
const minify = input => input.toString().replace(/(\n|\r\n|\t)/gm, "");


module.exports = { init, recompileDocs };