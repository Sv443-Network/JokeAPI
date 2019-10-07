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
        fs.readdir(settings.documentation.dirPath, (err, files) => {
            if(err) return console.log(`${jsl.colors.fg.red}Daemon got error: ${err}${jsl.colors.rst}\n`);

            let checksum = "";
            files.forEach((file, i) => {
                checksum += (i != 0 && i < files.length ? "-" : "") + farmhash.hash32(fs.readFileSync(`${settings.documentation.dirPath}${file}`)).toString();
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
};

module.exports = { init, recompileDocs };