// handles verbose logging

const scl = require("svcorelib");
const settings = require("../settings");

const col = scl.colors.fg;


/**
 * @typedef {"yellow"|"green"|"red"|"cyan"|"magenta"} AccentColor
 */

/** @type {AccentColor[]} */
const accentColors = ["yellow", "green", "red", "cyan", "magenta"];

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

    let accentColor = col.yellow;

    if(accentColors.includes(color))
    {
        switch(color)
        {
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
    
    console.log(`${accentColor}[DBG/${col.rst}${col.blue}${section}${col.rst}${accentColor}]${col.rst} - ${message}`);
}

module.exports = debug;
