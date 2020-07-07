const jsl = require("svjsl");
const logger = require("./logger");
const parseJokes = require("./parseJokes");
const analytics = require("./analytics");
const settings = require("../settings");


/**
 * @typedef {Object} AnalyticsData
 * @prop {String} ipAddress
 * @prop {Array<String>} urlPath
 * @prop {Object} urlParameters
 * @prop {Object} [submission] Only has to be used on type = "submission"
 */

/**
 * Logs a request to the console. The `type` parameter specifies the color and additional logging level
 * @param {("success"|"docs"|"ratelimited"|"error"|"blacklisted"|"docsrecompiled"|"submission")} type 
 * @param {String} [additionalInfo] Provides additional information in certain log types
 * @param {AnalyticsData} [analyticsData] Additional analytics data
 */
const logRequest = (type, additionalInfo, analyticsData) => {
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

            if(!jsl.isEmpty(analyticsData))
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

            if(!jsl.isEmpty(analyticsData))
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

            if(!jsl.isEmpty(analyticsData))
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

            if(!jsl.isEmpty(analyticsData))
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
            logChar = `\n\n${jsl.colors.fg.blue}⯈ Got a submission${!jsl.isEmpty(additionalInfo) ? ` from ${jsl.colors.fg.yellow}${additionalInfo.substring(0, 8)}` : ""}${jsl.colors.rst}\n\n`;
            spacerDisabled = true;

            if(!jsl.isEmpty(analyticsData))
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

            if(!jsl.isEmpty(analyticsData))
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
        process.stdout.write(`${(process.jokeapi.reqCounter % settings.logging.spacerAfter && !spacerDisabled) == 0 ? " " : ""}${color}${logChar}${jsl.colors.rst}`);

    if(logType != null)
        logger(logType, !jsl.isEmpty(additionalInfo) ? additionalInfo : "no additional information provided", true);

    if(jsl.isEmpty(process.jokeapi.reqCounter))
        process.jokeapi.reqCounter = 0;
    
    if(!spacerDisabled)
        process.jokeapi.reqCounter++;
}

/**
 * Sends an initialization message - called when the initialization is done
 * @param {Number} initTimestamp The timestamp of when JokeAPI was initialized
 */
const initMsg = (initTimestamp) => {
    console.log(` \n \n${jsl.colors.fg.blue}[${logger.getTimestamp(" | ")}] ${jsl.colors.fg.green}Started ${settings.info.name} v${settings.info.version}${jsl.colors.rst}`);
    console.log(` ├─ Registered and validated ${jsl.colors.fg.green}${parseJokes.jokeCount}${jsl.colors.rst} jokes`);
    if(analytics.connectionInfo && analytics.connectionInfo.connected)
        console.log(` ├─ Connected to analytics database at ${jsl.colors.fg.green}${analytics.connectionInfo.info}${jsl.colors.rst}`);
    else
        console.log(` ├─ Analytics database ${jsl.colors.fg.red}not connected${jsl.colors.rst}`);
    console.log(` ├─ ${settings.info.name} is listening at ${jsl.colors.fg.green}0.0.0.0:${settings.httpServer.port}${jsl.colors.rst}`);
    console.log(` └─ Initialization took ${jsl.colors.fg.green}${(new Date().getTime() - initTimestamp).toFixed(0)}ms${jsl.colors.rst}`);
    process.stdout.write("\n");
    
    if(!settings.debug.onlyLogErrors)
    {
        console.log(`\n  ${settings.colors.success}${settings.logging.logChar} Success ${settings.colors.docs}${settings.logging.logChar} Docs ${settings.colors.ratelimit}${settings.logging.logChar} RateLimited ${settings.colors.error}${settings.logging.logChar} Error${jsl.colors.rst}`);
        process.stdout.write("\x1b[2m");
        process.stdout.write("└┬───────────────────────────────────────┘\n");
        process.stdout.write(" └─► ");
        process.stdout.write(jsl.colors.rst);
    }
}

module.exports = logRequest;
module.exports.initMsg = initMsg;
