const scl = require("svcorelib");
const v8 = require("v8");

const logger = require("./logger");
const parseJokes = require("./parseJokes");
const analytics = require("./analytics");
const languages = require("./languages");
const jokeCache = require("./jokeCache");

const settings = require("../settings");

const col = scl.colors.fg;


/**
 * @typedef {Object} AnalyticsData
 * @prop {string} ipAddress
 * @prop {string[]} urlPath
 * @prop {Object} urlParameters
 * @prop {Object} [submission] Only has to be used on type = "submission"
 */

/** @typedef {"success"|"docs"|"ratelimited"|"error"|"blacklisted"|"docsrecompiled"|"submission"} RequestType */

/**
 * Logs a request to the console and to the analytics database
 * @param {RequestType} type Sets the color and logging level
 * @param {string} [additionalInfo] Provides additional information in certain log types
 * @param {AnalyticsData} [analyticsData] Additional analytics data
 */
function logRequest(type, additionalInfo, analyticsData)
{
    let color = "";
    let logType = null;
    let logDisabled = false;
    let spacerDisabled = false;
    let logChar = settings.logging.logChar;

    if(settings.debug.onlyLogErrors)
        logDisabled = true;

    switch(type)
    {
        case "success":
            color = settings.colors.success;

            if(!scl.isEmpty(analyticsData))
            {
                analytics({
                    type: "SuccessfulRequest",
                    data: {
                        ipAddress: analyticsData.ipAddress,
                        urlPath: analyticsData.urlPath,
                        urlParameters: analyticsData.urlParameters
                    }
                });
            }
        break;
        case "docs":
            color = settings.colors.docs;

            if(!scl.isEmpty(analyticsData))
            {
                analytics({
                    type: "Docs",
                    data: {
                        ipAddress: analyticsData.ipAddress,
                        urlPath: analyticsData.urlPath,
                        urlParameters: analyticsData.urlParameters
                    }
                });
            }
        break;
        case "ratelimited":
            color = settings.colors.ratelimit;
            logType = "ratelimit";

            if(!scl.isEmpty(analyticsData))
            {
                analytics({
                    type: "RateLimited",
                    data: {
                        ipAddress: analyticsData.ipAddress,
                        urlPath: analyticsData.urlPath,
                        urlParameters: analyticsData.urlParameters
                    }
                });
            }
        break;
        case "error":
            if(settings.debug.onlyLogErrors)
                logDisabled = false;

            color = settings.colors.ratelimit;
            logType = "error";

            if(!scl.isEmpty(analyticsData))
            {
                analytics({
                    type: "Error",
                    data: {
                        ipAddress: analyticsData.ipAddress,
                        urlPath: analyticsData.urlPath,
                        urlParameters: analyticsData.urlParameters,
                        errorMessage: additionalInfo
                    }
                });
            }
        break;
        case "docsrecompiled":
            color = settings.colors.docsrecompiled;
            logChar = "r ";
        break;
        case "submission":
            logChar = `\n\n${col.blue}⯈ Got a submission${!scl.isEmpty(additionalInfo) ? ` from ${col.yellow}${additionalInfo.substring(0, 8)}` : ""}${col.rst}\n\n`;
            spacerDisabled = true;

            if(!scl.isEmpty(analyticsData))
            {
                analytics({
                    type: "JokeSubmission",
                    data: {
                        ipAddress: analyticsData.ipAddress,
                        urlPath: analyticsData.urlPath,
                        urlParameters: analyticsData.urlParameters,
                        submission: analyticsData.submission
                    }
                });
            }
        break;
        case "blacklisted":
            color = settings.colors.blacklisted;
            logChar = "*";
            if(!settings.logging.blacklistLoggingEnabled)
                logDisabled = true;

            if(!scl.isEmpty(analyticsData))
            {
                analytics({
                    type: "Blacklisted",
                    data: {
                        ipAddress: analyticsData.ipAddress,
                        urlPath: analyticsData.urlPath,
                        urlParameters: analyticsData.urlParameters,
                        submission: analyticsData.submission
                    }
                });
            }
        break;
    }

    if(!settings.logging.disableLogging && !logDisabled)
        process.stdout.write(`${(process.jokeapi.reqCounter % settings.logging.spacerAfter && !spacerDisabled) == 0 ? " " : ""}${color}${logChar}${col.rst}`);

    if(logType != null)
        logger(logType, !scl.isEmpty(additionalInfo) ? additionalInfo : "no additional information provided", true);

    if(scl.isEmpty(process.jokeapi.reqCounter))
        process.jokeapi.reqCounter = 0;
    
    if(!spacerDisabled)
        process.jokeapi.reqCounter++;
}

/**
 * Sends an initialization message - called when the initialization is done
 * @param {number} initTimestamp The timestamp of when JokeAPI was initialized
 * @param {number} [initDurationMs] Duration until startup
 * @param {number} [loadingIconState] State of the loading icon - only if dashboard mode is active
 */
function initMsg(initTimestamp, initDurationMs, loadingIconState)
{
    let lines = [];
    let initMs = initDurationMs ? initDurationMs : (Date.now() - initTimestamp).toFixed(0);

    const heapStats = v8.getHeapStatistics();
    const hsMax = heapStats.heap_size_limit;
    const hsVal = heapStats.used_heap_size;
    const heapPercent = scl.mapRange(hsVal, 0, hsMax, 0, 100).toFixed(2);
    
    let heapColor = col.green;
    const brBlack = "\x1b[1m\x1b[30m";
    
    if(heapPercent >= 80)
        heapColor = col.red;
    if(heapPercent >= 60)
        heapColor = col.yellow;

    
    // loading icon
    let loadingIcon = "";
    if(typeof loadingIconState === "number")
    {
        loadingIcon += `${col.blue}`;
        const statesAmount = 4;

        switch(loadingIconState)
        {
            case 0:
                loadingIcon += "■┬─";
                break;
            case 1:
                loadingIcon += "─■─";
                break;
            case 2:
                loadingIcon += "─┬■";
                break;
            case 3:
                loadingIcon += "─■─";
                break;

            default:
                loadingIcon += "???";
                break;
        }

        loadingIcon += `${col.rst} `;

        loadingIconState++;
        if(loadingIconState == statesAmount)
            loadingIconState = 0;
    }
    

    lines.push(`\n${loadingIcon}${col.blue}[${logger.getTimestamp(" - ")}] ${col.rst}- ${col.blue}${settings.info.name} v${settings.info.version}${col.rst}\n`);
    lines.push(` ${brBlack}├─${col.rst} Registered and validated ${col.green}${parseJokes.jokeCount}${col.rst} jokes from ${col.green}${languages.jokeLangs().length}${col.rst} languages\n`);
    lines.push(` ${brBlack}├─${col.rst} Found ${col.green}${settings.jokes.possible.categories.length}${col.rst} categories, ${col.green}${settings.jokes.possible.flags.length}${col.rst} flags, ${col.green}${settings.jokes.possible.formats.length}${col.rst} formats\n`);
    if(analytics.connectionInfo && analytics.connectionInfo.connected)
        lines.push(` ${brBlack}├─${col.rst} Connected to analytics database at ${col.green}${analytics.connectionInfo.info}${col.rst}\n`);
    else
        lines.push(` ${brBlack}├─${col.rst} Analytics database ${settings.analytics.enabled ? col.red : col.yellow}not connected${settings.analytics.enabled ? "" : " (disabled)"}${col.rst}\n`);
    lines.push(` ${brBlack}├─${col.rst} Joke Cache database ${jokeCache.connectionInfo.connected ? `${col.green}connected` : `${col.red}not connected`}${col.rst}\n`);
    lines.push(` ${brBlack}├─${col.rst} HTTP${settings.httpServer.ssl.enabled ? "S" : ""} server is listening at ${col.green}${getLocalURL()}${col.rst} (SSL ${settings.httpServer.ssl.enabled ? `${col.green}enabled${col.rst}` : `${col.yellow}disabled${col.rst}`})\n`);
    lines.push(` ${brBlack}├─${col.rst} Initialization took ${col.green}${initMs}ms${initMs == 69 ? " (nice)" : ""}${col.rst}\n`);
    lines.push(` ${brBlack}└─${col.rst} Heap Usage: ${heapColor}${heapPercent}%${col.rst}\n`);

    let dbIntervalSeconds = settings.debug.dashboardInterval / 1000;
    if(dbIntervalSeconds % 1 != 0)
        dbIntervalSeconds = dbIntervalSeconds.toFixed(1);

    lines.push(`${brBlack}${!settings.debug.dashboardEnabled ? "" : `  • Dashboard mode enabled (${dbIntervalSeconds}s interval)\n`}${col.rst}`);

    // GDPR compliance notice
    if(!settings.httpServer.ipHashing.enabled || settings.jokeCaching.expiryHours <= 0)
        lines.push(`${col.yellow}  • Not compliant with the GDPR${col.rst}\n`);

    lines.push("\n");

    lines.push(`Colors: ${col.green}Success ${col.yellow}Warning/Info ${col.red}Error${col.rst}\n`);

    // make it look better when spammed by debug messages immediately after:
    if(settings.debug.verboseLogging)
        lines.push("\n\n");
    
    // if(!settings.debug.onlyLogErrors)
    // {
    //     lines.push(`\n  ${settings.colors.success}${settings.logging.logChar} Success ${settings.colors.docs}${settings.logging.logChar} Docs ${settings.colors.ratelimit}${settings.logging.logChar} RateLimited ${settings.colors.error}${settings.logging.logChar} Error${col.rst}\n`);
    //     lines.push("\x1b[2m");
    //     lines.push("└┬───────────────────────────────────────┘\n");
    //     lines.push(" └─► ");
    //     lines.push(col.rst);
    // }

    let writeLines = lines.join("");

    // clear, then immediately write using stdout directly, to try to remove "jitter" when updating the dashboard
    console.clear();
    process.stdout.write(writeLines);

    if(settings.debug.dashboardEnabled)
    {
        if(typeof loadingIconState != "number")
            loadingIconState = 0;

        setTimeout(() => {
            initMsg(initTimestamp, initMs, loadingIconState);
        }, settings.debug.dashboardInterval);
    }
}

function getLocalURL()
{
    return `${settings.httpServer.ssl.enabled ? "https" : "http"}://127.0.0.1:${settings.httpServer.port}/`;
}

module.exports = logRequest;
module.exports.initMsg = initMsg;
