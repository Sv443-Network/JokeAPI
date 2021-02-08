const scl = require("svcorelib");
const fs = require("fs-extra");
const http = require("http");

var httpServer = require("./httpServer"); // module loading order is a bit fucked, so this module has to be loaded multiple times
const parseJokes = require("./parseJokes");
const logRequest = require("./logRequest");
const convertFileFormat = require("./fileFormatConverter");
const analytics = require("./analytics");
const parseURL = require("./parseURL");
const meter = require("./meter");
const tr = require("./translate");

const settings = require("../settings");
const fileFormatConverter = require("./fileFormatConverter");

scl.unused(http, analytics, tr);


/**
 * To be called when a joke is submitted
 * @param {http.ServerResponse} res
 * @param {string} data
 * @param {string} fileFormat
 * @param {string} ip
 * @param {(analytics.AnalyticsDocsRequest|analytics.AnalyticsSuccessfulRequest|analytics.AnalyticsRateLimited|analytics.AnalyticsError|analytics.AnalyticsSubmission)} analyticsObject
 * @param {boolean} dryRun Set to true to not add the joke to the joke file after validating it
 */
function jokeSubmission(res, data, fileFormat, ip, analyticsObject, dryRun)
{
    try
    {
        if(typeof dryRun != "boolean")
            dryRun = false;

        if(typeof httpServer == "object" && Object.keys(httpServer).length <= 0)
            httpServer = require("./httpServer");

        let submittedJoke = JSON.parse(data);

        let langCode = submittedJoke.lang || settings.languages.defaultLanguage;

        if(scl.isEmpty(submittedJoke))
            return httpServer.respondWithError(res, 105, 400, fileFormat, tr(langCode, "requestBodyIsInvalid"), langCode);

        let invalidChars = data.match(settings.jokes.submissions.invalidCharRegex);
        let invalidCharsStr = invalidChars ? invalidChars.map(ch => `0x${ch.charCodeAt(0).toString(16)}`).join(", ") : null;
        if(invalidCharsStr && invalidChars.length > 0)
            return httpServer.respondWithError(res, 109, 400, fileFormat, tr(langCode, "invalidChars", invalidCharsStr), langCode);

        if(submittedJoke.formatVersion == parseJokes.jokeFormatVersion && submittedJoke.formatVersion == settings.jokes.jokesFormatVersion)
        {
            // format version is correct, validate joke now
            const validationResult = parseJokes.validateSubmission(submittedJoke, langCode);

            if(!validationResult.valid)
            {
                // joke is invalid, respond with error
                const clientResponse = {
                    error: true,
                    internalError: false,
                    code: 105,
                    message: tr(langCode, "submissionMalformedJoke"),
                    causedBy: validationResult.errorStrings,
                    timestamp: 1612822945543,
                    additionalInfo: "",
                    parameterValidity: validationResult.jokeParams
                };

                return scl.http.pipeString(res, fileFormatConverter.auto(fileFormat, clientResponse, langCode), parseURL.getMimeTypeFromFileFormatString(fileFormat), 400);
                // return httpServer.respondWithError(res, 105, 400, fileFormat, tr(langCode, "submittedJokeFormatInvalid", validationResult.join("\n")), langCode);
            }
            else
            {
                // joke is valid, find file name and then write to file

                let sanitizedIP = ip.replace(settings.httpServer.ipSanitization.regex, settings.httpServer.ipSanitization.replaceChar).substring(0, 8);
                let curUnix = new Date().getTime();
                let fileName = `${settings.jokes.jokeSubmissionPath}${langCode}/submission_${sanitizedIP}_0_${curUnix}.json`;

                let iter = 0;
                let findNextNum = currentNum => {
                    iter++;
                    if(iter >= settings.httpServer.rateLimiting)
                    {
                        logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                        return httpServer.respondWithError(res, 101, 429, fileFormat, tr(langCode, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame));
                    }

                    if(fs.existsSync(`${settings.jokes.jokeSubmissionPath}submission_${sanitizedIP}_${currentNum}_${curUnix}.json`))
                        return findNextNum(currentNum + 1);
                    else return currentNum;
                };

                fs.ensureDirSync(`${settings.jokes.jokeSubmissionPath}${langCode}`);

                if(fs.existsSync(`${settings.jokes.jokeSubmissionPath}${fileName}`))
                    fileName = `${settings.jokes.jokeSubmissionPath}${langCode}/submission_${sanitizedIP}_${findNextNum()}_${curUnix}.json`;

                try
                {
                    // file name was found, write to file now:
                    if(dryRun)
                    {
                        let respObj = {
                            error: false,
                            message: tr(langCode, "dryRunSuccessful", parseJokes.jokeFormatVersion, submittedJoke.formatVersion),
                            timestamp: new Date().getTime()
                        };

                        return httpServer.pipeString(res, fileFormatConverter.auto(fileFormat, respObj, langCode), parseURL.getMimeTypeFromFileFormatString(fileFormat), 201);
                    }
                    return writeJokeToFile(res, fileName, submittedJoke, fileFormat, ip, analyticsObject, langCode);
                }
                catch(err)
                {
                    return httpServer.respondWithError(res, 100, 500, fileFormat, tr(langCode, "errWhileSavingSubmission", err), langCode);
                }
            }
        }
        else
        {
            return httpServer.respondWithError(res, 105, 400, fileFormat, tr(langCode, "wrongFormatVersion", parseJokes.jokeFormatVersion, submittedJoke.formatVersion), langCode);
        }
    }
    catch(err)
    {
        return httpServer.respondWithError(res, 105, 400, fileFormat, tr(settings.languages.defaultLanguage, "invalidJSON", err), settings.languages.defaultLanguage);
    }
}

/**
 * Writes a joke to a json file
 * @param {http.ServerResponse} res
 * @param {string} filePath
 * @param {parseJokes.SingleJoke|parseJokes.TwopartJoke} submittedJoke
 * @param {string} fileFormat
 * @param {string} ip
 * @param {(analytics.AnalyticsDocsRequest|analytics.AnalyticsSuccessfulRequest|analytics.AnalyticsRateLimited|analytics.AnalyticsError|analytics.AnalyticsSubmission)} analyticsObject
 * @param {string} [langCode]
 */
function writeJokeToFile(res, filePath, submittedJoke, fileFormat, ip, analyticsObject, langCode)
{
    if(typeof httpServer == "object" && Object.keys(httpServer).length <= 0)
        httpServer = require("./httpServer");

    let reformattedJoke = reformatJoke(submittedJoke);

    fs.writeFile(filePath, JSON.stringify(reformattedJoke, null, 4), err => {
        if(!err)
        {
            // successfully wrote to file
            let responseObj = {
                "error": false,
                "message": tr(langCode, "submissionSaved"),
                "submission": reformattedJoke,
                "timestamp": new Date().getTime()
            };

            meter.update("submission", 1);

            let submissionObject = analyticsObject;
            submissionObject.submission = reformattedJoke;
            logRequest("submission", ip, submissionObject);

            return httpServer.pipeString(res, convertFileFormat.auto(fileFormat, responseObj, langCode), parseURL.getMimeTypeFromFileFormatString(fileFormat), 201);
        }
        // error while writing to file
        else return httpServer.respondWithError(res, 100, 500, fileFormat, tr(langCode, "errWhileSavingSubmission", err), langCode);
    });
}

/**
 * Ensures that a joke is formatted as expected
 * @param {parseJokes.SingleJoke|parseJokes.TwopartJoke} joke
 * @returns {parseJokes.SingleJoke|parseJokes.TwopartJoke}
 */
function reformatJoke(joke)
{
    let retJoke = {};

    if(joke.formatVersion)
        retJoke.formatVersion = joke.formatVersion;

    retJoke = {
        ...retJoke,
        category: parseJokes.resolveCategoryAlias(joke.category),
        type: joke.type
    };

    if(joke.type == "single")
    {
        retJoke.joke = joke.joke;
    }
    else if(joke.type == "twopart")
    {
        retJoke.setup = joke.setup;
        retJoke.delivery = joke.delivery;
    }

    retJoke.flags = {
        nsfw: joke.flags.nsfw,
        religious: joke.flags.religious,
        political: joke.flags.political,
        racist: joke.flags.racist,
        sexist: joke.flags.sexist,
        explicit: joke.flags.explicit,
    };

    if(joke.lang)
        retJoke.lang = joke.lang;

    if(joke.id)
        retJoke.id = joke.id;

    retJoke.safe = joke.safe || false;

    return retJoke;
}

module.exports = jokeSubmission;
module.exports.reformatJoke = reformatJoke;
