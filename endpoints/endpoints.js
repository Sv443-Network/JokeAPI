const http = require("http");
const convertFileFormat = require("../src/fileFormatConverter");
const httpServer = require("../src/httpServer");
const parseURL = require("../src/parseURL");
const jsl = require("svjsl");
const fs = require("fs");
const settings = require("../settings");

jsl.unused(http);


const meta = {
    "name": "Endpoints",
    "desc": "Returns a list of all endpoints and how to use them",
    "usage": {
        "method": "GET",
        "url": `${settings.info.docsURL}/endpoints`,
        "supportedParams": [
            "format"
        ]
    }
};

/**
 * Calls this endpoint
 * @param {http.IncomingMessage} req The HTTP server request
 * @param {http.ServerResponse} res The HTTP server response
 * @param {Array<String>} url URL path array gotten from the URL parser module
 * @param {Object} params URL query params gotten from the URL parser module
 * @param {String} format The file format to respond with
 */
const call = (req, res, url, params, format) => {
    jsl.unused([req, url, params]);

    let endpointList = [];

    try 
    {
        fs.readdir(settings.endpoints.dirPath, (err, files) => {
            if(!err)
            {
                files.forEach(f => {
                    if(f.endsWith(".js"))
                    {
                        let fileMeta = require(`./${f}`).meta;

                        if(jsl.isEmpty(fileMeta))
                            return epError(res, format, `Couldn't find metadata object of endpoint "${f.replace(".js", "")}"`);

                        if(jsl.isEmpty(fileMeta.unlisted) && !jsl.isEmpty(fileMeta.usage))
                        {
                            if(format != "xml")
                            {
                                endpointList.push({
                                    name: fileMeta.name,
                                    description: fileMeta.desc,
                                    usage: {
                                        method: fileMeta.usage.method,
                                        url: fileMeta.usage.url,
                                        supportedParams: fileMeta.usage.supportedParams
                                    }
                                });
                            }
                            else if(format == "xml")
                            {
                                endpointList.push({
                                    name: fileMeta.name,
                                    description: fileMeta.desc,
                                    usage: {
                                        method: fileMeta.usage.method,
                                        url: fileMeta.usage.url,
                                        supportedParams: {"param": fileMeta.usage.supportedParams}
                                    }
                                });
                            }
                        }
                    }
                });

                endpointList.push({
                    name: "Submit",
                    description: `Used to submit a joke to be added to ${settings.info.name}`,
                    usage: {
                        method: "PUT",
                        url: `${settings.info.docsURL}/submit`,
                        supportedParams: []
                    }
                });

                if(format == "xml")
                    endpointList = { "endpoint": endpointList};

                return httpServer.pipeString(res, convertFileFormat.auto(format, endpointList), parseURL.getMimeTypeFromFileFormatString(format));
            }
            else return epError(res, format, err);
        });
    }
    catch(err)
    {
        return epError(res, format, err);
    }
};

const epError = (res, format, err) => {
    let errFromRegistry = require("." + settings.errors.errorMessagesPath)["100"];

    let errObj = {};

    if(format != "xml")
    {
        errObj = {
            "error": true,
            "internalError": true,
            "code": 100,
            "message": errFromRegistry.errorMessage,
            "causedBy": errFromRegistry.causedBy,
            "additionalInfo": err,
            "timestamp": new Date().getTime()
        }
    }
    else if(format == "xml")
    {
        errObj = {
            "error": true,
            "internalError": true,
            "code": 100,
            "message": errFromRegistry.errorMessage,
            "causedBy": {"cause": errFromRegistry.causedBy},
            "additionalInfo": err,
            "timestamp": new Date().getTime()
        }
    }

    httpServer.pipeString(res, convertFileFormat.auto(format, errObj), parseURL.getMimeTypeFromFileFormatString(format));
};

module.exports = { meta, call };
