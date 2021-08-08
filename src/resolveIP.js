const { unused } = require("svcorelib");
const crypto = require("crypto");
const reqIP = require("request-ip");
const net = require("net");
const settings = require("../settings");


/**
 * Extracts the IP address from a HTTP request object
 * @param {import("http").IncomingMessage} req HTTP request object to resolve the IP of
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

    // if IP couldn't be extracted, try using the "Cf-Pseudo-IPv4" header, see https://support.cloudflare.com/hc/en-us/articles/229666767-Understanding-and-configuring-Cloudflare-s-IPv6-support#h_877db671-916a-4085-9676-8eb27eaa2a91
    if(!net.isIP(ipaddr))
    {
        if(req.headers && typeof req.headers["cf-pseudo-ipv4"] == "string" && isValidIP(req.headers["cf-pseudo-ipv4"]))
            ipaddr = req.headers["cf-pseudo-ipv4"];
    }

    // if "Cf-Pseudo-IPv4" is not present or invalid, use the country of origin as a last effort substitute
    if(!net.isIP(ipaddr))
    {
        if(req.headers && typeof req.headers["cf_ipcountry"] == "string")
            ipaddr = `unknown_${req.headers["cf_ipcountry"]}`;
    }

    return settings.httpServer.ipHashing.enabled ? hashIP(ipaddr) : ipaddr;
}

/**
 * Checks if an IP is local or not (`localhost`, `127.0.0.1`, `::1`, etc.)
 * @param {string} ip
 * @returns {boolean}
 */
function isLocal(ip)
{
    const localIPs = ["localhost", "127.0.0.1", "::1", "::ffff:127.0.0.1"];
    let isLocal = false;

    localIPs.forEach(locIP => {
        if(isLocal) // short circuit
            return;

        const h = hashIP(locIP);

        if(ip.match(locIP) || ip.match(h))
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
    const hash = crypto.createHash(settings.httpServer.ipHashing.algorithm);+
    hash.update(ip, "utf8");
    return hash.digest(settings.httpServer.ipHashing.digest).toString();
}

module.exports = resolveIP;
module.exports.isValidIP = isValidIP;
module.exports.hashIP = hashIP;
module.exports.isLocal = isLocal;
