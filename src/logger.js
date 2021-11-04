const fs = require("fs-extra");
const { isEmpty, colors } = require("svcorelib");

const settings = require("../settings");


/** @typedef {import("./types/debug").LoggerType} LoggerType */


/**
 * Logs something to a file
 * @param {LoggerType} type The type of log
 * @param {string} content The content of the log
 * @param {boolean} timestamp Whether or not to include a timestamp
 */
function logger(type, content, timestamp)
{
    try
    {
        timestamp = isEmpty(timestamp) || typeof timestamp != "boolean" ? true: timestamp;

        let errorType = "";
        let errorContent = "";

        switch(type)
        {
            case "error":
            case "ratelimit":
            case "fatal":
                errorType = type;
                errorContent = content;
            break;
            default:
                errorType = "fatal";
                errorContent = `Error while logging - wrong type ${type} specified.\nContent of the error: ${content}`;
            break;
        }

        if(timestamp)
        {
            errorContent = `[${getTimestamp()}]  ${errorContent}`;
        }

        errorContent += "\n";

        let logFileName = `${settings.errors.errorLogDir}${errorType}.log`;

        if(fs.existsSync(logFileName))
            fs.appendFileSync(logFileName, errorContent);
        else
            fs.writeFileSync(logFileName, errorContent);
    }
    catch(err)
    {
        console.log(`\n\n${colors.fg.red}Fatal Error while logging!\n${colors.fg.yellow}${err}${colors.rst}\n`);
        process.exit(1);
    }
}

/**
 * Returns a preformatted timestamp in local time
 * @param {string} [separator] A separator to add between the date and the time - leave empty for ` - `
 * @returns {string}
 */
function getTimestamp(separator)
{
    const d = new Date();

    const dt = {
        y: d.getFullYear(),
        m: (d.getMonth() + 1),
        d: d.getDate(),
        th: d.getHours(),
        tm: d.getMinutes(),
        ts: d.getSeconds()
    }

    return `${dt.y}/${(dt.m < 10 ? "0" : "") + dt.m}/${(dt.d < 10 ? "0" : "") + dt.d}`
         + `${isEmpty(separator) ? " - " : separator}`
         + `${(dt.th < 10 ? "0" : "") + dt.th}:${(dt.tm < 10 ? "0" : "") + dt.tm}:${(dt.ts < 10 ? "0" : "") + dt.ts}`;
}

module.exports = logger;
module.exports.getTimestamp = getTimestamp;
