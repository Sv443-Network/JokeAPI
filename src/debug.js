// handles verbose logging

const scl = require("svcorelib");
const settings = require("../settings");

const col = scl.colors.fg;


/**
 * @typedef {"yellow"|"green"|"red"|"cyan"|"magenta"} AccentColor
 */

/** @type {AccentColor[]} */
const accentColors = ["yellow", "green", "red", "cyan", "magenta", "gray"];

/**
 * Logs a preformatted message to the console if `settings.debug.verboseLogging` is set to `true`, else does nothing
 * @param {string} section
 * @param {string} message
 * @param {AccentColor} [color] Defaults to "yellow"
 */
function debug(section, message, color)
{
    if(settings.debug.verboseLogging !== true)
        return;

    let accentColor = col.black;

    if(accentColors.includes(color))
    {
        switch(color)
        {
            case "gray":
                accentColor = col.black;
            break;
            case "green":
                accentColor = col.green;
            break;
            case "red":
                accentColor = col.red;
            break;
            case "magenta":
                accentColor = col.magenta;
            break;
            case "cyan":
                accentColor = col.cyan;
            break;
            case "yellow": default:
                accentColor = col.yellow;
            break;
        }
    }

    process.stdout.write(`${accentColor}[DBG/${col.rst}${col.blue}${section}${col.rst}${accentColor}]${col.rst} : ${message}\n`);
}

module.exports = debug;
