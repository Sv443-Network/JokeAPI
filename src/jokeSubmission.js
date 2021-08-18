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
const { isValidLang } = require("./languages");

scl.unused(http, analytics, tr);

/** @typedef {parseJokes.SingleJoke|parseJokes.TwopartJoke} JokeSubmission */


/**
 * To be called when a joke is submitted
 * @param {http.ServerResponse} res
 * @param {string|object} data
 * @param {string} fileFormat
 * @param {string} ip
 * @param {(analytics.AnalyticsDocsRequest|analytics.AnalyticsSuccessfulRequest|analytics.AnalyticsRateLimited|analytics.AnalyticsError|analytics.AnalyticsSubmission)} analyticsObject
 * @param {boolean} dryRun Set to true to not add the joke to the joke file after validating it
 * @param {string} lang API response langauge (not joke submission language) - defaults to `settings.languages.defaultLanguage`
 */
function jokeSubmission(res, data, fileFormat, ip, analyticsObject, dryRun, lang)
{
    // TODO: ensure language stuff in here works

    if(!isValidLang(lang))
        lang = settings.languages.defaultLanguage;

    try
    {
        if(dryRun !== true)
            dryRun = false;

        // TODO: fix this circular dependency monstrosity
        if(typeof httpServer === "object" && Object.keys(httpServer).length <= 0)
            httpServer = require("./httpServer");

        const submission = typeof data === "string" ? JSON.parse(data) : data;

        const submissionLang = (submission.lang || settings.languages.defaultLanguage).toString().toLowerCase();

        if(scl.isEmpty(submission))
            return httpServer.respondWithError(res, 105, 400, fileFormat, tr(lang, "requestBodyIsInvalid"), lang);

        const invalidChars = data.match(settings.jokes.submissions.invalidCharRegex);
        const invalidCharsStr = invalidChars ? invalidChars.map(ch => `0x${ch.charCodeAt(0).toString(16)}`).join(", ") : null;
        if(invalidCharsStr && invalidChars.length > 0)
            return httpServer.respondWithError(res, 109, 400, fileFormat, tr(lang, "invalidChars", invalidCharsStr), lang);

        if(submission.formatVersion == parseJokes.jokeFormatVersion && submission.formatVersion == settings.jokes.jokesFormatVersion)
        {
            // format version is correct, validate joke now
            const validationResult = parseJokes.validateSubmission(submission, lang);

            if(!validationResult.valid)
            {
                // joke is invalid, respond with error
                const clientResponse = {
                    error: true,
                    internalError: false,
                    code: 105,
                    message: tr(lang, "submissionMalformedJoke"),
                    causedBy: validationResult.errorStrings,
                    additionalInfo: "",
                    validProperties: validationResult.jokeParams,
                    timestamp: Date.now(),
                };

                return scl.http.pipeString(res, fileFormatConverter.auto(fileFormat, clientResponse, lang), parseURL.getMimeType(fileFormat), 400);
                // return httpServer.respondWithError(res, 105, 400, fileFormat, tr(langCode, "submittedJokeFormatInvalid", validationResult.join("\n")), langCode);
            }
            else
            {
                // joke is valid, find file name and then write to file

                const sanitizedIP = ip.replace(settings.httpServer.ipSanitization.regex, settings.httpServer.ipSanitization.replaceChar).substring(0, 16);
                const curTS = Date.now();
                let fileName = `${settings.jokes.jokeSubmissionPath}${submissionLang}/submission_${sanitizedIP}_0_${curTS}.json`;

                let iter = 0;
                const findNextNum = currentNum => {
                    iter++;
                    if(iter >= settings.httpServer.rateLimiting)
                    {
                        logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                        return httpServer.respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame));
                    }

                    if(fs.existsSync(`${settings.jokes.jokeSubmissionPath}submission_${sanitizedIP}_${currentNum}_${curTS}.json`))
                        return findNextNum(currentNum + 1);
                    else return currentNum;
                };

                fs.ensureDirSync(`${settings.jokes.jokeSubmissionPath}${submissionLang}`);

                if(fs.existsSync(`${settings.jokes.jokeSubmissionPath}${fileName}`))
                    fileName = `${settings.jokes.jokeSubmissionPath}${submissionLang}/submission_${sanitizedIP}_${findNextNum()}_${curTS}.json`;

                try
                {
                    // file name was found, write to file now:
                    if(dryRun)
                    {
                        const respObj = {
                            error: false,
                            message: tr(lang, "dryRunSuccessful", parseJokes.jokeFormatVersion, submission.formatVersion),
                            submission,
                            validProperties: validationResult.jokeParams,
                            timestamp: Date.now(),
                        };

                        return httpServer.pipeString(res, fileFormatConverter.auto(fileFormat, respObj, lang), parseURL.getMimeType(fileFormat), 201);
                    }

                    return writeJokeToFile(res, fileName, submission, fileFormat, ip, analyticsObject, lang, validationResult);
                }
                catch(err)
                {
                    return httpServer.respondWithError(res, 100, 500, fileFormat, tr(lang, "errWhileSavingSubmission", err), lang);
                }
            }
        }
        else
        {
            return httpServer.respondWithError(res, 105, 400, fileFormat, tr(lang, "wrongFormatVersion", parseJokes.jokeFormatVersion, submission.formatVersion), lang);
        }
    }
    catch(err)
    {
        return httpServer.respondWithError(res, 105, 400, fileFormat, tr(lang, "invalidJSON", err), lang);
    }
}

/**
 * Writes a joke to a json file
 * @param {http.ServerResponse} res
 * @param {string} filePath
 * @param {JokeSubmission} submittedJoke
 * @param {string} fileFormat
 * @param {string} ip
 * @param {(analytics.AnalyticsDocsRequest|analytics.AnalyticsSuccessfulRequest|analytics.AnalyticsRateLimited|analytics.AnalyticsError|analytics.AnalyticsSubmission)} analyticsObject
 * @param {string} [langCode]
 * @param {parseJokes.ValidationResult} validationResult
 */
function writeJokeToFile(res, filePath, submittedJoke, fileFormat, ip, analyticsObject, langCode, validationResult)
{
    // TODO: fix this monstrosity
    if(typeof httpServer === "object" && Object.keys(httpServer).length <= 0)
        httpServer = require("./httpServer");

    const reformattedJoke = reformatJoke(submittedJoke);

    fs.writeFile(filePath, JSON.stringify(reformattedJoke, null, 4), err => {
        if(!err)
        {
            // successfully wrote to file
            const responseObj = {
                error: false,
                message: tr(langCode, "submissionSaved"),
                submission: reformattedJoke,
                validProperties: validationResult.jokeParams,
                timestamp: Date.now(),
            };

            meter.update("submission", 1);

            const submissionObject = analyticsObject;
            submissionObject.submission = reformattedJoke;
            logRequest("submission", ip, submissionObject);

            return httpServer.pipeString(res, convertFileFormat.auto(fileFormat, responseObj, langCode), parseURL.getMimeType(fileFormat), 201);
        }
        // error while writing to file
        else return httpServer.respondWithError(res, 100, 500, fileFormat, tr(langCode, "errWhileSavingSubmission", err), langCode);
    });
}

/**
 * Coarse filter that ensures that a joke is formatted as expected - doesn't add missing properties though!
 * @param {JokeSubmission} joke
 * @returns {JokeSubmission} Returns the reformatted joke
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

    if(joke.type === "single")
    {
        retJoke.joke = joke.joke;
    }
    else if(joke.type === "twopart")
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

    retJoke.lang = retJoke.lang.toLowerCase();

    if(joke.id)
        retJoke.id = joke.id;

    if(joke.safe)
        retJoke.safe = joke.safe || false;

    return retJoke;
}

module.exports = jokeSubmission;
module.exports.reformatJoke = reformatJoke;
