const debug = require("../verboseLogging");
const Endpoint = require("./Endpoint");

// const filterComponentsTrFile = require(`../../${settings.jokes.possible.filterComponentTranslationFile}`);
const filterComponentsTrFile = require("../../data/translations/filterComponents.json");


/**
 * @typedef {"categories"|"formats"} FilterComponentName
 */

/**
 * Base class for all filter component endpoints (/categories/, /flags/, /formats/, etc.)
 */
class FilterComponentEndpoint extends Endpoint {
    /**
     * Constructs a new object of class JokeComponentEndpoint  
     * This class is intended to be subclassed! Don't use it "raw" like this!
     * @param {FilterComponentName} filterComponentName
     * @param {string} pathName At which path this endpoint will be called
     * @param {Endpoint.EndpointMeta} meta Meta information about this endpoint
     */
    constructor(filterComponentName, pathName, meta)
    {
        super(pathName, meta);


        this._componentDescriptions = {};

        let trKeys = Object.keys(filterComponentsTrFile.tr[filterComponentName]);

        trKeys.forEach((trKey, i) => {
            Object.keys(filterComponentsTrFile.tr[filterComponentName][trKey]).forEach(langCode => {
                if(i == 0)
                    this._componentDescriptions[langCode] = [];
                
                this._componentDescriptions[langCode].push({
                    name: trKey,
                    description: filterComponentsTrFile.tr[filterComponentName][trKey][langCode]
                })
            });
        });

        debug("FilterComponentEndpoint", `Instantiated filter component endpoint "${filterComponentName}" at /${pathName}/`);
    }

    /**
     * Returns all descriptions of this component
     * @param {string} lang Language code
     * @returns {Object|null} Returns `null` if no decsriptions were found
     */
    getComponentDescriptions(lang)
    {
        const descs = this._componentDescriptions[lang];

        if(!Array.isArray(descs))
            return null;

        return descs;
    }
}

module.exports = FilterComponentEndpoint;
