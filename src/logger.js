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
            let d = new Date();
            let timestamp = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
            errorContent = `[${timestamp}]  ${errorContent}`;
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

module.exports = logger;