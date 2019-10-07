// this module initializes the blacklist, whitelist and console blacklist

const jsl = require("svjsl");
const farmhash = require("farmhash");
const fs = require("fs");
const settings = require("../settings");
const debug = require("./verboseLogging");


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
                recompileDocs();

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
        inject(`${settings.documentation.rawDirPath}index.js`).then(injected_js => {
            fs.writeFileSync(`${settings.documentation.dirPath}index_injected.js`, injected_js);
            inject(`${settings.documentation.rawDirPath}index.css`).then(injected_css => {
                fs.writeFileSync(`${settings.documentation.dirPath}index_injected.css`, injected_css);
                inject(`${settings.documentation.rawDirPath}index.html`).then(injected_html => {
                    fs.writeFileSync(`${settings.documentation.dirPath}documentation.html`, injected_html);
                    debug("Docs", "Done recompiling docs.");
                }).catch(err => injectError(err));
            }).catch(err => injectError(err));
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
                file = file.replace(/<!--%#INSERT:VERSION#%-->/gm, settings.info.version);
                file = file.replace(/<!--%#INSERT:NAME#%-->/gm, settings.info.name);
                file = file.replace(/<!--%#INSERT:DESC#%-->/gm, settings.info.desc);
                file = file.replace(/<!--%#INSERT:AUTHORWEBSITEURL#%-->/gm, settings.info.author.website);
                file = file.replace(/<!--%#INSERT:AUTHORGITHUBURL#%-->/gm, settings.info.author.github);
                file = file.replace(/<!--%#INSERT:PROJGITHUBURL#%-->/gm, settings.info.projGitHub);
                file = file.replace(/<!--%#INSERT:JOKESUBMISSIONURL#%-->/gm, settings.jokes.jokeSubmissionURL);
                file = file.replace(/<!--%#INSERT:CATEGORYARRAY#%-->/gm, `["${settings.jokes.possible.categories.join(`", "`)}"]`);
                file = file.replace(/<!--%#INSERT:FLAGSARRAY#%-->/gm, `["${settings.jokes.possible.flags.join(`", "`)}"]`);

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