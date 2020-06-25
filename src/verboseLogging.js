// handles verbose logging

const jsl = require("svjsl");
const settings = require("../settings");

const col = jsl.colors;

/**
 * Logs a preformatted message to the console if `settings.debug.verboseLogging` is set to `true`, else does nothing
 * @param {String} section
 * @param {String} message
 */
const verboseLogging = (section, message) => {
    if(jsl.isEmpty(settings.debug.verboseLogging) || settings.debug.verboseLogging === false)
        return;
    
    console.log(`${col.fg.yellow}[DBG/${col.rst}${col.fg.blue}${section}${col.rst}${col.fg.yellow}]${col.rst} - ${message}`);
}

module.exports = verboseLogging;