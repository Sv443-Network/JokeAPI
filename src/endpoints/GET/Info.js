const scl = require("svcorelib");

const main = require("../../main");
const parseJokes = require("../../parseJokes");
const languages = require("../../languages");
const settings = require("../../../settings");
const translate = require("../../translate");

const Endpoint = require("../../classes/Endpoint");


/**
 * Returns a variety of information and properties
 */
class Info extends Endpoint {
    /**
     * Returns a variety of information and properties
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            docsURL: "https://jokeapi.dev/#info-endpoint",
            usage: {
                method: "GET",
                supportedParams: [
                    "format",
                    "lang"
                ]
            }
        };

        super("info", meta);
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {http.IncomingMessage} req The HTTP server request
     * @param {http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {Object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     * @param {import("../../httpServer").HttpMetrics} httpMetrics
     */
    call(req, res, url, params, format, httpMetrics)
    {
        scl.unused(req, url);

        const lang = Endpoint.getLang(params);

        const supportedLangsLength = languages.jokeLangs().length;
        const systemLanguagesLength = translate.systemLangs().length;

        let responseObj = {};
    
        const totalJokesCount = (!scl.isEmpty(parseJokes.jokeCount) ? parseJokes.jokeCount : 0);
        
        let idRangePerLang = {};
        let idRangePerLangXml = [];
        Object.keys(parseJokes.jokeCountPerLang).forEach(lc => {
            let to = (parseJokes.jokeCountPerLang[lc] - 1);
            idRangePerLang[lc] = [ 0, to ];
            idRangePerLangXml.push({
                langCode: lc,
                from: 0,
                to: to
            });
        });

        const now = Date.now();
    
        if(format != "xml")
        {
            responseObj = {
                "error": false,
                "version": settings.info.version,
                "versionInt": settings.info.versionInt,
                "jokes":
                {
                    "totalCount": totalJokesCount,
                    "categories": [settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories],
                    "flags": settings.jokes.possible.flags,
                    "types": settings.jokes.possible.types,
                    "submissionURL": settings.jokes.jokeSubmissionURL,
                    "idRange": idRangePerLang,
                    "safeJokes": parseJokes.safeJokes
                },
                "formats": settings.jokes.possible.formats,
                "jokeLanguages": supportedLangsLength,
                "systemLanguages": systemLanguagesLength,
                "info": translate(lang, "messageOfTheDay", settings.info.name),
                "splash": main.getSplash(lang),
                "serverLatency": (now - httpMetrics.requestArrival.getTime()),
                "timestamp": Date.now()
            };
        }
        else if(format == "xml")
        {
            const versionIntNames = [ "major", "minor", "patch" ];
            let versionIntXml = {};

            settings.info.versionInt.forEach((ver, i) => {
                const vName = versionIntNames[i] || "Other";
                versionIntXml[vName] = ver;
            });

            responseObj = {
                "error": false,
                "version": settings.info.version,
                "versionInt": versionIntXml,
                "jokes":
                {
                    "totalCount": totalJokesCount,
                    "categories": { "category": [ settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories ] },
                    "flags": { "flag": settings.jokes.possible.flags },
                    "types": { "type": settings.jokes.possible.types },
                    "submissionURL": settings.jokes.jokeSubmissionURL,
                    "idRanges": { "idRange": idRangePerLangXml },
                    "safeJokes": { "language": parseJokes.safeJokes }
                },
                "formats": { "format": settings.jokes.possible.formats },
                "jokeLanguages": supportedLangsLength,
                "systemLanguages": systemLanguagesLength,
                "info": translate(lang, "messageOfTheDay", settings.info.name),
                "splash": main.getSplash(lang),
                "serverLatency": (now - httpMetrics.requestArrival.getTime()),
                "timestamp": Date.now()
            };
        }

        return Endpoint.respond(res, format, lang, responseObj);
    }
}

module.exports = Info;
