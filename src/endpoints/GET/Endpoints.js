const scl = require("svcorelib");
const path = require("path");
const fs = require("fs-extra");

const Endpoint = require("../../classes/Endpoint");

const settings = require("../../../settings");
const { isValidLang } = require("../../languages");


/**
 * @typedef {object} EndpointList
 * @prop {EndpointObj} [en]
 * @prop {EndpointObj} [de]
 */

/** 
 * @typedef {Object} EndpointObj
 * @prop {Endpoint.EndpointMeta} meta
 * @prop {string} pathName
 * @prop {string} displayName
 * @prop {string} description
 * @prop {string[]} positionalArgs
 */

/**
 * Returns a list of all endpoints and their description and usage
 */
class Endpoints extends Endpoint
{
    /**
     * Returns a list of all endpoints and their description and usage
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            docsURL: "https://jokeapi.dev/#endpoints-endpoint",
            usage: {
                method: "GET",
                supportedParams: [
                    "format",
                    "lang"
                ]
            }
        };

        super("endpoints", meta);

        /** @type {EndpointList} */
        this.endpoints = this.readEndpoints();
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {http.IncomingMessage} req The HTTP server request
     * @param {http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     */
    call(req, res, url, params, format)
    {
        scl.unused(req, url);

        const lang = Endpoint.getLang(params);


        const responseObj = [];

        /** @type {EndpointObj[]} */
        const epList =
            ( Array.isArray(this.endpoints[lang]) && this.endpoints[lang].length > 0 )
            ? this.endpoints[lang]
            : this.endpoints[settings.languages.defaultLanguage];

        if(!epList)
            throw new Error(`Endpoint list wasn't initialized yet`);

        epList.forEach(ep => {
            let epUrl = `${settings.info.docsURL}/${ep.pathName}`;

            if(Array.isArray(ep.positionalArgs) && ep.positionalArgs.length > 0)
                ep.positionalArgs.forEach(pArg => epUrl += `/{${pArg}}`);

            const epObj = {
                name: ep.displayName,
                description: ep.description,
                docsURL: ep.meta.docsURL || null,
                usage: {
                    method: ep.meta.usage.method,
                    url: epUrl,
                    supportedParams: (format != "xml" ? ep.meta.usage.supportedParams : { "param": ep.meta.usage.supportedParams }),
                }
            };

            responseObj.push(epObj);
        });

        if(format == "xml")
            return Endpoint.respond(res, format, lang, { "endpoint": responseObj });

        return Endpoint.respond(res, format, lang, responseObj);
    }

    /**
     * Reads endpoints dir, returning a list of all endpoints
     * @returns {EndpointList}
     */
    readEndpoints()
    {
        /** @type {EndpointList} */
        const epList = {};

        // add "Endpoints.js" endpoint to the list (would cause recursive imports down the line so it has to be done this way)
        this.getTranslationLangs().forEach(lang => {
            if(!epList[lang] || !Array.isArray(epList[lang]))
                epList[lang] = [];

            epList[lang].push({
                meta: this.meta,
                pathName: this.getPathName(),
                displayName: this.getDisplayName(lang),
                description: this.getDescription(lang),
                positionalArgs: this.getPositionalArguments()
            });
        });

        const readEndpointsDir = (epDirPath) => {
            const files = fs.readdirSync(epDirPath);

            if(Array.isArray(files) && files.length > 0)
            {
                files.forEach(f => {
                    if(f.endsWith(".js"))
                    {
                        if(f.toLowerCase() === "endpoints.js") // recursively imports itself so its meta needs to be manually provided above
                            return;

                        const absPath = path.resolve(epDirPath, f);

                        /** @type {Endpoint} */
                        const EndpointClass = require(absPath);

                        /** @type {Endpoint} */
                        const endpointInstance = new EndpointClass();

                        const trLangs = endpointInstance.getTranslationLangs();
                        const epMeta = endpointInstance.getMeta();

                        trLangs.forEach(lang => {
                            if(!isValidLang(lang))
                                return;

                            if(!epList[lang] || !Array.isArray(epList[lang]))
                                epList[lang] = [];

                            if(epMeta.unlisted !== true)
                            {
                                epList[lang].push({
                                    meta: epMeta,
                                    pathName: endpointInstance.getPathName(),
                                    displayName: endpointInstance.getDisplayName(lang),
                                    description: endpointInstance.getDescription(lang),
                                    positionalArgs: endpointInstance.getPositionalArguments()
                                });
                            }
                        });
                    }
                });
            }
        };

        readEndpointsDir(settings.endpoints.get.dirPath);
        readEndpointsDir(settings.endpoints.post.dirPath);

        return epList;
    }
}

module.exports = Endpoints;
