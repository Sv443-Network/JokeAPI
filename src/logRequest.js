const scl = require("svcorelib");
const v8 = require("v8");

const logger = require("./logger");
const parseJokes = require("./parseJokes");
const analytics = require("./analytics");
const languages = require("./languages");
const jokeCache = require("./jokeCache");
const debug = require("./debug");

const settings = require("../settings");

const col = scl.colors.fg;

/** Data that persists until JokeAPI is stopped */
const persistentData = {
    /** Max amount of heap used, ever (in percent) */
    maxHeapUsage: 0,
    /** Amount of requests sent to JokeAPI */
    reqCounter: 0
};


/**
 * @typedef {object} AnalyticsData
 * @prop {string} ipAddress
 * @prop {string[]} urlPath
 * @prop {object} urlParameters
 * @prop {object} [submission] Only has to be used on type = "submission"
 */

/** @typedef {"success"|"docs"|"ratelimited"|"error"|"blacklisted"|"docsrecompiled"|"submission"} AnalyticsType */

/**
 * Logs a request to the console and to the analytics database
 * @param {AnalyticsType} type Determines all kinds of properties, like the color and logging level
 * @param {string} [additionalInfo] Provide additional information (applies only to certain log types)
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
        process.stdout.write(`${(persistentData.reqCounter % settings.logging.spacerAfter && !spacerDisabled) == 0 ? " " : ""}${color}${logChar}${col.rst}`);

    if(logType != null)
        logger(logType, !scl.isEmpty(additionalInfo) ? additionalInfo : "no additional information provided", true);

    if(scl.isEmpty(persistentData.reqCounter))
        persistentData.reqCounter = 0;

    if(!spacerDisabled)
        persistentData.reqCounter++;
}

/**
 * Sends an initialization message - called when the initialization is done
 * @param {number} initTimestamp The UNIX timestamp of when JokeAPI was initialized
 * @param {number} [initDurationMs] Duration until startup
 * @param {number} [activityIndicatorState] State of the activity indicator - only shown if dashboard mode is active
 * @param {number} [initTimeDeduction] Time that should be deducted from the init time
 */
function initMsg(initTimestamp, initDurationMs, activityIndicatorState, initTimeDeduction)
{
    const lines = [];
    const initMs = initDurationMs ? initDurationMs : (Date.now() - initTimestamp);
    const initMsDeducted = initTimeDeduction ? initMs - initTimeDeduction : initMs;

    const heapStats = v8.getHeapStatistics();
    const hsMax = heapStats.heap_size_limit;
    const hsVal = heapStats.used_heap_size;
    const heapPercent = parseFloat(scl.mapRange(hsVal, 0, hsMax, 0, 100).toFixed(2));

    debug("LogRequest", `Startup metrics: initMs=${initMs} | initTimeDed=${initTimeDeduction} | initMsDed=${initMsDeducted} | initialHeapUsage=${heapPercent}%`);

    if(settings.debug.dashboardEnabled && heapPercent > persistentData.maxHeapUsage)
        persistentData.maxHeapUsage = heapPercent;

    const heapColor = getHeapColor(heapPercent);
    const maxHeapColor = settings.debug.dashboardEnabled ? getHeapColor(persistentData.maxHeapUsage) : null;

    const brBlack = "\x1b[1m\x1b[30m";

    debug("LogRequest", `Building and printing init message...\n`, "green");


    /** Amount of states the activity indicator has (1-indexed) */
    const statesAmount = 4;

    // overflow to 0
    if(activityIndicatorState > (statesAmount - 1))
        activityIndicatorState = 0;

    const activityIndicator = getActivityIndicator(activityIndicatorState);


    let maxHeapText = settings.debug.dashboardEnabled ? ` (max: ${maxHeapColor}${persistentData.maxHeapUsage}%${col.rst})` : "";

    lines.push(`\n${activityIndicator}${col.blue}[${logger.getTimestamp()}] ${col.rst}- ${col.blue}${settings.info.name} v${settings.info.version}${col.rst}\n`);
    lines.push(` ${brBlack}├─${col.rst} Registered and validated ${col.green}${parseJokes.jokeCount}${col.rst} jokes from ${col.green}${languages.jokeLangs().length}${col.rst} languages\n`);
    lines.push(` ${brBlack}├─${col.rst} Found filter components: ${col.green}${settings.jokes.possible.categories.length}${col.rst} categories, ${col.green}${settings.jokes.possible.flags.length}${col.rst} flags, ${col.green}${settings.jokes.possible.formats.length}${col.rst} formats\n`);
    if(analytics.connectionInfo && analytics.connectionInfo.connected)
        lines.push(` ${brBlack}├─${col.rst} Connected to analytics database at ${col.green}${analytics.connectionInfo.info}${col.rst}\n`);
    else
        lines.push(` ${brBlack}├─${col.rst} Analytics database ${settings.analytics.enabled ? col.red : col.yellow}not connected${settings.analytics.enabled ? "" : " (disabled)"}${col.rst}\n`);
    lines.push(` ${brBlack}├─${col.rst} Joke cache database ${jokeCache.connectionInfo.connected ? `${col.green}connected` : `${col.red}not connected`}${col.rst}\n`);
    lines.push(` ${brBlack}├─${col.rst} HTTP${settings.httpServer.ssl.enabled ? "S" : ""} server is listening at ${col.green}${getLocalURL()}${col.rst} (SSL ${settings.httpServer.ssl.enabled ? `${col.green}enabled${col.rst}` : `${col.yellow}disabled${col.rst}`})\n`);
    lines.push(` ${brBlack}├─${col.rst} Initialization took ${col.green}${initMsDeducted}ms${initMsDeducted == 69 ? " (nice)" : ""}${col.rst}${initMs !== initMsDeducted ? ` (after deduction - total is ${col.yellow}${initMs}ms${col.rst})` : ""}\n`);
    lines.push(` ${brBlack}└─${col.rst} ${!settings.debug.dashboardEnabled ? "Initial heap" : "Heap"} usage: ${heapColor}${heapPercent}%${col.rst}${maxHeapText}\n`);

    let dbIntervalSeconds = settings.debug.dashboardInterval / 1000;
    if(dbIntervalSeconds % 1 != 0)
        dbIntervalSeconds = dbIntervalSeconds.toFixed(1);

    lines.push(`${brBlack}${!settings.debug.dashboardEnabled ? "" : `  • Dashboard mode enabled (${dbIntervalSeconds}s interval)\n`}${col.rst}`);

    // GDPR compliance notice
    if(!isGdprCompliant())
        lines.push(`${col.yellow}  • Not compliant with the GDPR${col.rst}\n`);

    lines.push("\n");

    lines.push(`Colors: ${col.green}Success ${col.rst}• ${col.yellow}Info/Warning ${col.rst}• ${col.red}Error${col.rst}\n`);

    // make it look better when spammed by debug messages immediately after:
    if(settings.debug.verboseLogging)
        lines.push("\n");

    const writeLines = lines.join("");


    // clear (if dashboard enabled), then immediately write using stdout directly, to try to remove "jitter" when updating the dashboard
    if(settings.debug.dashboardEnabled)
        console.clear();

    process.stdout.write(writeLines);

    if(settings.debug.dashboardEnabled)
    {
        if(typeof activityIndicatorState != "number")
            activityIndicatorState = 0;

        setTimeout(() => {
            activityIndicatorState++;

            initMsg(initTimestamp, initMs, activityIndicatorState, initTimeDeduction);
        }, settings.debug.dashboardInterval);
    }
}

/**
 * Returns an activity indicator based on the passed state number. Defaults to question mark(s) if the state is out of range or invalid
 * @param {number} [state=0] If empty, defaults to `0`
 * @returns {string} Returns an empty string if `settings.debug.dashboardEnabled` is set to `false`
 */
function getActivityIndicator(state)
{
    if(!settings.debug.dashboardEnabled)
        return "";

    state = parseInt(state);

    if(!state || isNaN(state))
        state = 0;


    let indicator = "";

    if(typeof state === "number")
    {
        indicator += `${col.blue}`;

        switch(state)
        {
            case 0:
                indicator += "■┬─";
                break;
            case 1:
            case 3:
                indicator += "─■─";
                break;
            case 2:
                indicator += "─┬■";
                break;

            default:
                indicator += "???";
                break;
        }

        indicator += `${col.rst} `;
    }

    return indicator;
}

/**
 * Returns the local URL of JokeAPI depending on a few settings
 * @returns {string}
 */
function getLocalURL()
{
    return `${settings.httpServer.ssl.enabled ? "https" : "http"}://127.0.0.1:${settings.httpServer.port}/`;
}

/**
 * Returns a color value depending on an input percentage
 * @param {number} percentage Float between 0 and 100
 * @returns {string}
 */
function getHeapColor(percentage)
{
    if(percentage >= 80)
        return col.red;
    else if(percentage >= 60)
        return col.yellow;
    else
        return col.green;
}

/**
 * Checks if JokeAPI is GDPR compliant
 * @returns {boolean}
 */
function isGdprCompliant()
{
    return !(!settings.httpServer.ipHashing.enabled || settings.jokeCaching.expiryHours <= 0);
}


module.exports = logRequest;
module.exports.initMsg = initMsg;
