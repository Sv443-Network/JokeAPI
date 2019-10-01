// this module parses the passed URL, returning an object that is uniform and easy to use

const jsl = require("svjsl");

/**
 * Parses the passed URL, returning a fancy object
 * @param {String} url
 * @returns {Object}
 */
const parseURL = url => {
    let error = null;

    let pathArr = [];
    let qstrObj = {};

    try 
    {
        let rawPath = url.split("?")[0];
        let rawQstr = url.split("?")[1];


        if(rawPath.includes("/"))
            pathArr = rawPath.split("/");
        else pathArr = [rawQstr];

        pathArr.forEach((pathSection, i) => {
            if(jsl.isEmpty(pathSection))
                pathArr.splice(i, 1);
        });


        let qstrArr = [];
        if(!jsl.isEmpty(rawQstr) && rawQstr.includes("&"))
            qstrArr = rawQstr.split("&");
        else if(!jsl.isEmpty(rawQstr))
            qstrArr = [rawQstr];


        if(qstrArr.length > 0)
            qstrArr.forEach(qstrEntry => {
                if(qstrEntry.includes("="))
                    qstrObj[qstrEntry.split("=")[0]] = qstrEntry.split("=")[1];
            });
        else qstrObj = null;
    }
    catch(err)
    {
        error = err;
    }


    if(!error)
        return {
            initialURL: url,
            pathArray: pathArr,
            queryParams: qstrObj
        }
    else
        return {
            error: error,
            initialURL: url
        }
}

module.exports = parseURL;