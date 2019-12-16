const http = require("http");
const jsl = require("svjsl");
const crypto = require("crypto");
const settings = require("../settings");

jsl.unused(http);



/**
 * Extracts the IP address from a HTTP request object
 * @param {http.ServerResponse} req The HTTP req object
 * @returns {String}
 */
const resolveIP = req => {
    let ipaddr = null;

    try
    {
        if(!jsl.isEmpty(req.headers) && !jsl.isEmpty(req.headers["x-forwarded-for"]) && settings.httpServer.reverseProxy) // format: <client>, <proxy1>, <proxy2>
        {
            ipaddr = req.headers["x-forwarded-for"]; // I have to use the X-Forwarded-For header because I'm using a reverse proxy
            let ipSplit = ipaddr.split(/[,]\s*/gm);
            if(ipaddr.includes(","))
                ipaddr = ipSplit[0]; // try to get IP from <client>
            if(!isValidIP(ipaddr))
                ipaddr = ipSplit[1]; // if <client> IP is invalid, try <proxy1> instead
            if(!isValidIP(ipaddr))
                ipaddr = req.connection.remoteAddress; // else just default to the remote IP
        }
        else ipaddr = req.connection.remoteAddress;
    }
    catch(err)
    {
        ipaddr = null;
    }

    ipaddr = ipaddr.trim();

    if(jsl.isEmpty(ipaddr)) // if the reverse proxy didn't work, try getting the IP from the Cloudflare headers
    {
        if(!jsl.isEmpty(req.headers["cf_connecting_ip"]) && (isValidIP(req.headers["cf_connecting_ip"]))) // Cloudflare
            ipaddr = req.headers["cf_connecting_ip"];
        else if(!jsl.isEmpty(req.headers["x_real_ip"]) && (isValidIP(req.headers["x_real_ip"]))) // Cloudflare
            ipaddr = req.headers["x_real_ip"];
        else if(!jsl.isEmpty(req.headers["x-proxyuser-ip"]) && (isValidIP(req.headers["x-proxyuser-ip"]))) // Google services
            ipaddr = req.headers["x-proxyuser-ip"];
        else ipaddr = "err";
    }

    ipaddr = (ipaddr.length < 15 ? ipaddr : (ipaddr.substr(0,7) === "::ffff:" ? ipaddr.substr(7) : "err"));

    try
    {
        if(settings.httpServer.ipHashing.enabled && isValidIP(ipaddr))
            ipaddr = hashIP(ipaddr);
        else if(settings.httpServer.ipHashing.enabled)
            ipaddr = "err";
        return typeof ipaddr == "string" ? ipaddr : ipaddr.toString();
    }
    catch(err)
    {
        return "err";
    }
};

const ipv4regex = settings.httpServer.regexes.ipv4;
const ipv6regex = settings.httpServer.regexes.ipv6;

const isValidIP = ip => (ip.match(ipv4regex) || ip.match(ipv6regex));
const hashIP = ip => crypto.createHash(settings.httpServer.ipHashing.algorithm).update(ip, "utf8").digest(settings.httpServer.ipHashing.digest).toString();

module.exports = resolveIP;
module.exports.isValidIP = isValidIP;
module.exports.hashIP = hashIP;