const fs = require("fs");
const jsl = require("svjsl");
const settings = require("../settings");

/**
 * Logs something to a file
 * @param {("error"|"ratelimit"|"fatal")} type The type of log
 * @param {String} content The content of the log
 * @param {Boolean} timestamp Whether or not to include a timestamp
 */
const logger = (type, content, timestamp) => {
    try
    {
        timestamp = jsl.isEmpty(timestamp) || typeof timestamp != "boolean" ? true: timestamp;

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
        console.log(`\n\n${jsl.colors.fg.red}Fatal Error while logging!\n${jsl.colors.fg.yellow}${err}${jsl.colors.rst}\n`);
        process.exit(1);
    }
};

/**
 * Returns a preformatted timestamp in local time
 * @param {String} [separator] A separator to add between the date and the time - leave empty for single whitespace
 * @returns {String}
 */
const getTimestamp = (separator) => {
    let d = new Date();

    let dt = {
        y: d.getFullYear(),
        m: (d.getMonth() + 1),
        d: d.getDate(),
        th: d.getHours(),
        tm: d.getMinutes(),
        ts: d.getSeconds()
    }

    return `${dt.y}/${(dt.m < 10 ? "0" : "") + dt.m}/${(dt.d < 10 ? "0" : "") + dt.d}`
         + `${jsl.isEmpty(separator) ? " " : separator}`
         + `${(dt.th < 10 ? "0" : "") + dt.th}:${(dt.tm < 10 ? "0" : "") + dt.tm}:${(dt.ts < 10 ? "0" : "") + dt.ts}`;

}

module.exports = logger;
module.exports.getTimestamp = getTimestamp;