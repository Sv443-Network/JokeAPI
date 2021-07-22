const http = require("http");
const scl = require("svcorelib");
const crypto = require("crypto");
const reqIP = require("request-ip");
const net = require("net");
const settings = require("../settings");

scl.unused(http);



/**
 * Extracts the IP address from a HTTP request object
 * @param {http.ServerResponse} req The HTTP req object
 * @returns {string}
 */
function resolveIP(req)
{
    /** @type {string|null} Client's IP address */
    let ipaddr = null;

    try
    {
        ipaddr = reqIP.getClientIp(req);
    }
    catch(err)
    {
        unused(err);

        ipaddr = null;
    }

    if(ipaddr == null)
    {
        if(req.headers && typeof req.headers["cf-pseudo-ipv4"] == "string" && isValidIP(req.headers["cf-pseudo-ipv4"]))
            ipaddr = req.headers["cf-pseudo-ipv4"];
    }

    if(ipaddr == null)
    {
        if(req.headers && typeof req.headers["cf_ipcountry"] == "string")
            ipaddr = `unknown_${req.headers["cf_ipcountry"]}`;
    }

    return settings.httpServer.ipHashing.enabled ? hashIP(ipaddr) : ipaddr;
}

/**
 * Checks if an IP is local or not (`localhost`, `127.0.0.1`, `::1`, etc.)
 * @param {string} ip
 * @param {boolean} [inputIsHashed=false] If the input IP is hashed, set this to true
 * @returns {boolean}
 */
function isLocal(ip, inputIsHashed = false)
{
    const localIPs = ["localhost", "127.0.0.1", "::1"];
    let isLocal = false;

    localIPs.forEach(locIP => {
        if(isLocal) // short circuit
            return;

        if(inputIsHashed && ip.match(hashIP(locIP)))
            isLocal = true;
        else if(!inputIsHashed && ip.match(locIP))
            isLocal = true;
    });

    return isLocal;
}

/**
 * Checks whether or not an IP address is valid
 * @param {string} ip
 * @returns {boolean}
 */
function isValidIP(ip)
{
    return net.isIP(ip) > 0;
}

/**
 * Hashes an IP address with the algorithm defined in `settings.httpServer.ipHashing.algorithm`
 * @param {string} ip
 * @returns {string}
 */
function hashIP(ip)
{
    const hash = crypto.createHash(settings.httpServer.ipHashing.algorithm);
    hash.update(ip, "utf8");
    return hash.digest(settings.httpServer.ipHashing.digest).toString();
}

module.exports = resolveIP;
module.exports.isValidIP = isValidIP;
module.exports.hashIP = hashIP;
module.exports.isLocal = isLocal;
