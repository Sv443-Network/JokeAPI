const http = require("http");
const jsl = require("svjsl");
const settings = require("../settings");

jsl.unused(http);



/**
 * Extracts the IP address from a HTTP request object
 * @param {http.ServerResponse} req The HTTP req object
 * @returns {String}
 */
const resolveIP = req => {
    let ipaddr = null;

    //return "blacklist_test";

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
        ipaddr = null;
    }

    if(jsl.isEmpty(ipaddr))
    {
        if(!jsl.isEmpty(req.headers["cf_connecting_ip"]) && (isValidIP(req.headers["cf_connecting_ip"]) || isValidIP(req.headers["cf_connecting_ip"])))
            ipaddr = req.headers["cf_connecting_ip"];
        else if(!jsl.isEmpty(req.headers["x_real_ip"]) && (isValidIP(req.headers["x_real_ip"]) || isValidIP(req.headers["x_real_ip"])))
            ipaddr = req.headers["x_real_ip"];
        else ipaddr = "err";
    }

    ipaddr = (ipaddr.length<15?ipaddr:(ipaddr.substr(0,7)==='::ffff:'?ipaddr.substr(7):"err"));

    try
    {
        return typeof ipaddr == "string" ? ipaddr : ipaddr.toString();
    }
    catch(err)
    {
        return "err";
    }
};

const isValidIP = ip => (ip.match(settings.httpServer.regexes.ipv4) || ip.match(settings.httpServer.regexes.ipv6));

module.exports = resolveIP;
module.exports.isValidIP = isValidIP;