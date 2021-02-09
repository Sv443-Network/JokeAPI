const scl = require("svcorelib");
const path = require("path");
const fs = require("fs-extra");
// const parseJokes = require("../parseJokes");
// const languages = require("../languages");
// const settings = require("../../settings");
// const translate = require("../translate");

const Endpoint = require("../classes/Endpoint");

const settings = require("../../settings");


/** 
 * @typedef {object} EndpointObj
 * @prop {Endpoint.EndpointMeta} meta
 * @prop {string} pathName
 * @prop {string} displayName
 * @prop {string} description
 * @prop {string[]} positionalArgs
 */

/**
 * Returns a list of all endpoints and their description and usage
 */
class Endpoints extends Endpoint {
    /**
     * Returns a list of all endpoints and their description and usage
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            usage: {
                method: "GET",
                supportedParams: [
                    "format",
                    "lang"
                ]
            }
        };

        super("endpoints", meta);

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


        let responseObj = [];

        this.endpoints.forEach(ep => {
            let epUrl = `${settings.info.docsURL}/${ep.pathName}/`;

            if(Array.isArray(ep.positionalArgs) && ep.positionalArgs.length > 0)
                ep.positionalArgs.forEach(pArg => epUrl += `{${pArg}}/`);

            let epObj = {
                name: ep.displayName,
                description: ep.description,
                usage: {
                    method: ep.meta.usage.method,
                    url: epUrl
                }
            };

            if(format != "xml")
                epObj.usage.supportedParams = ep.meta.usage.supportedParams
            else
                epObj.usage.supportedParams = {"param": ep.meta.usage.supportedParams}

            responseObj.push(epObj);
        });

        if(format == "xml")
            responseObj = {"endpoint": responseObj};


        return Endpoint.respond(res, format, lang, responseObj);
    }

    /**
     * Reads endpoints dir, returning a list of all endpoints
     * @param {string} lang
     * @returns {EndpointObj[]}
     */
    readEndpoints(lang)
    {
        let epList = [
            {
                meta: this.meta,
                pathName: this.pathName,
                displayName: this.getDisplayName(lang),
                description: this.getDescription(lang)
            }
        ];

        const files = fs.readdirSync(settings.endpoints.dirPath);

        if(Array.isArray(files) && files.length > 0)
        {
            files.forEach(f => {
                if(f.endsWith(".js"))
                {
                    if(f.toLowerCase() == "endpoints.js")
                        return;

                    const absPath = path.resolve(settings.endpoints.dirPath, f);

                    /** @type {Endpoint} */
                    const EndpointClass = require(absPath);

                    /** @type {Endpoint} */
                    let endpointInstance = new EndpointClass();

                    let epMeta = endpointInstance.getMeta();

                    if(epMeta.unlisted !== true)
                    {
                        epList.push({
                            meta: epMeta,
                            pathName: endpointInstance.getPathName(),
                            displayName: endpointInstance.getDisplayName(lang),
                            description: endpointInstance.getDescription(lang),
                            positionalArgs: endpointInstance.getPositionalArguments()
                        });
                    }
                }
            });

            return epList;
        }
        else
            return [];
    }
}

module.exports = Endpoints;
