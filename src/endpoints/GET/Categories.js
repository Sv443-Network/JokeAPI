const { unused } = require("svcorelib");

const tr = require("../../translate");
const Endpoint = require("../../classes/Endpoint");
const FilterComponentEndpoint = require("../../classes/FilterComponentEndpoint");

const settings = require("../../../settings");


/**
 * @typedef {Object} CategoryDescriptionObj
 * @prop {"Misc"|"Programming"|"Dark"|"Pun"|"Spooky"|"Christmas"} category
 * @prop {string} description
 */

/**
 * @typedef {Object} CatDescMember
 * @prop {CategoryDescriptionObj[]} en
 * @prop {CategoryDescriptionObj[]} de
 */

/**
 * Returns a list of categories and category aliases, as well as category descriptions
 */
class Categories extends FilterComponentEndpoint {
    /**
     * Returns a list of categories and category aliases, as well as category descriptions
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            docsURL: "https://jokeapi.dev/#categories-endpoint",
            usage: {
                method: "GET",
                supportedParams: [
                    "format",
                    "lang",
                ],
            },
        };

        super("categories", "categories", meta);
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {http.IncomingMessage} req The HTTP server request
     * @param {http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {Object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     */
    call(req, res, url, params, format)
    {
        unused(req, url);

        const lang = Endpoint.getLang(params);

        let statusCode = 200;
        let responseObj = {};


        const primaryCategories = [settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories];
        let catAliases = [];
        
        const descriptions = {};

        settings.jokes.possible.categories.forEach(category => {
            descriptions[category] = tr.getFilterComponentDescription(lang, "categories", category);
        });

        Object.keys(settings.jokes.possible.categoryAliases).forEach(key => {
            catAliases.push({
                alias: key,
                resolved: settings.jokes.possible.categoryAliases[key],
            });
        });

        if(format != "xml")
        {
            responseObj = {
                "error": false,
                "categories": primaryCategories,
                "descriptions": descriptions,
                "categoryAliases": catAliases,
                "timestamp": Date.now(),
            };
        }
        else
        {
            responseObj = {
                "error": false,
                "categories": { "category": primaryCategories },
                "descriptions": { "description": descriptions },
                "categoryAliases": { "categoryAlias": catAliases },
                "timestamp": Date.now(),
            };
        }
        

        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = Categories;
