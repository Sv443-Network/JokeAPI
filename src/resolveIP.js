const http = require("http");
const jsl = require("svjsl");

jsl.unused(http);



/**
 * Extracts the IP address from a HTTP request object
 * @param {http.ServerResponse} req The HTTP req object
 * @returns {String}
 */
const resolveIP = req => {
    let ipaddr = "err";

    try
    {
        if(!jsl.isEmpty(req.headers) && !jsl.isEmpty(req.headers["x-forwarded-for"]))
        {
            ipaddr = req.headers["x-forwarded-for"]; // I have to use the X-Forwarded-For header because I'm using a reverse proxy
            if(ipaddr.includes(",")) ipaddr = ipaddr.split(",")[0];
        }
        else ipaddr = req.connection.remoteAddress;
    }
    catch(err)
    {
        ipaddr = "err";
    }

    return (ipaddr.length<15?ipaddr:(ipaddr.substr(0,7)==='::ffff:'?ipaddr.substr(7):"err"));
    //return "blacklist_test";
};
module.exports = resolveIP;