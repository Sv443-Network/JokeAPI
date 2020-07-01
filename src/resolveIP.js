const http = require("http");
const jsl = require("svjsl");
const crypto = require("crypto");
const reqIP = require("request-ip");
const net = require("net");
const settings = require("../settings");

jsl.unused(http);



/**
 * Extracts the IP address from a HTTP request object
 * @param {http.ServerResponse} req The HTTP req object
 * @returns {String}
 */
const resolveIP = req => {
    let ipaddr = null;

    ipaddr = reqIP.getClientIp(req);

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

    return hashIP(ipaddr);
};

/**
 * Checks if an IP is local or not (`localhost`, `127.0.0.1`, `::1`, etc.)
 * @param {String} ip
 * @param {Boolean} [inputIsHashed=false] If the input IP is hashed, set this to true
 * @returns {Boolean}
 */
const isLocal = (ip, inputIsHashed = false) => {
    let localIPs = ["localhost", "127.0.0.1", "::1"];
    let isLocal = false;

    localIPs.forEach(lIP => {
        if(inputIsHashed && ip.match(lIP))
            isLocal = true;
        else if(!inputIsHashed && ip.match(hashIP(lIP)))
            isLocal = true;
    });

    return isLocal;
};

/**
 * Checks whether or not an IP address is valid
 * @param {String} ip
 * @returns {Boolean}
 */
const isValidIP = ip => net.isIP(ip) > 0;

/**
 * Hashes an IP address with the algorithm defined in `settings.httpServer.ipHashing.algorithm`
 * @param {String} ip
 * @returns {String}
 */
const hashIP = ip => {
    let hash = crypto.createHash(settings.httpServer.ipHashing.algorithm);
    hash.update(ip, "utf8");
    return hash.digest(settings.httpServer.ipHashing.digest).toString();
};

module.exports = resolveIP;
module.exports.isValidIP = isValidIP;
module.exports.hashIP = hashIP;
module.exports. isLocal = isLocal;
