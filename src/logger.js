const { readdir, appendFile, writeFile, stat } = require("fs-extra");
const { filesystem, isEmpty, colors } = require("svcorelib");
const { join } = require("path");

const settings = require("../settings");


/** Max size of log files in bytes */
const maxSize = 1000 * 1000 * 50;


async function init()
{
    // run file size check on startup, then once a day
    checkFileSize();

    setInterval(() => checkFileSize(), 1000 * 60 * 60 * 24);
}

async function checkFileSize()
{
    try
    {
        const files = await readdir(settings.errors.errorLogDir);

        if(files.length === 0)
            return;

        const fileProms = [];

        for(const file of files)
        {
            fileProms.push(new Promise(async (res) => {
                const path = join(settings.errors.errorLogDir, file);

                const st = await stat(path);

                if(!isNaN(parseInt(st?.size)) && st?.size > maxSize)
                    await writeFile(path, "");

                return res();
            }));
        }

        await Promise.all(fileProms);
    }
    catch(err)
    {
        console.error(`Error while checking log file size: ${err}`);
    }
}

/**
 * Logs something to a file
 * @param {"error"|"ratelimit"|"fatal"} type The type of log
 * @param {String} content The content of the log
 * @param {Boolean} timestamp Whether or not to include a timestamp
 */
async function logger(type, content, timestamp)
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

        if(await filesystem.exists(logFileName))
            await appendFile(logFileName, errorContent);
        else
            await writeFile(logFileName, errorContent);
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
        ts: d.getSeconds(),
    };

    return `${dt.y}/${(dt.m < 10 ? "0" : "") + dt.m}/${(dt.d < 10 ? "0" : "") + dt.d}`
         + `${isEmpty(separator) ? " - " : separator}`
         + `${(dt.th < 10 ? "0" : "") + dt.th}:${(dt.tm < 10 ? "0" : "") + dt.tm}:${(dt.ts < 10 ? "0" : "") + dt.ts}`;
}

module.exports = logger;
module.exports.init = init;
module.exports.getTimestamp = getTimestamp;
