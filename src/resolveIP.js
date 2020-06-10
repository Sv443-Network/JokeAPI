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

    /*
        Procedure:
        1. HEAD  x-forwarded-for
        2. HEAD  cf-connecting-ip
        3. HEAD  x-proxyuser-ip
        4. HEAD  cf-pseudo-ipv4
        5. VAL   HTTP_REMOTE_ADDR
        6. VAL   err_no_IP::HEAD_cf-ipcountry
        7. VAL   err_no_IP
        8. VAL   err_couldnt_hash
    */

    let usedRevProxy = false;
    try
    {
        if(req.headers && settings.httpServer.reverseProxy && req.headers["x-forwarded-for"]) // format: <client>, <proxy1>, <proxy2>
        {
            ipaddr = req.headers["x-forwarded-for"]; // reverse proxy adds this header

            let ipSplit = ipaddr.split(/[,]\s*/gm);
            if(ipaddr.includes(",") || isValidIP(ipSplit[0]))
                ipaddr = ipSplit[0] || null; // try to get IP from <client>
            else if(!isValidIP(ipaddr))
            {
                // else if IP invalid:
                if((Array.isArray(ipSplit) && ipSplit.length >= 1) && ipaddr.includes(",") && isValidIP(ipSplit[1]))
                    ipaddr = ipSplit[1]; // if <client> IP is invalid, try <proxy1> instead
                else
                    ipaddr = req.connection.remoteAddress || null; // else just default to the remote IP or if that doesn't exist, null
            }
            usedRevProxy = true;
        }
        else
            ipaddr = req.connection.remoteAddress || null; // if reverse proxy is disabled, default to the remote IP or if that doesn't exist, null
    }
    catch(err)
    {
        ipaddr = null; // if any error is thrown, default to null
    }

    ipaddr = ipaddr.toString().trim(); // trim whitespaces
    ipaddr = (ipaddr != null && isValidIP(ipaddr)) ? ipaddr : null; // if the IP up to this point is valid, leave it as it is, else set it to null

    if(jsl.isEmpty(ipaddr) || (settings.httpServer.reverseProxy && !usedRevProxy)) // if the reverse proxy didn't work, try getting the IP from the Gateway / Proxy headers
    {
        if(!jsl.isEmpty(req.headers["cf-connecting-ip"]) && (isValidIP(req.headers["cf-connecting-ip"]))) // Cloudflare
            ipaddr = req.headers["cf-connecting-ip"];
        else if(!jsl.isEmpty(req.headers["x-proxyuser-ip"]) && (isValidIP(req.headers["x-proxyuser-ip"]))) // Google services
            ipaddr = req.headers["x-proxyuser-ip"];
        else if(!jsl.isEmpty(req.headers["cf-pseudo-ipv4"]) && isValidIP(req.headers["cf-pseudo-ipv4"])) // Cloudflare pseudo IPv4 replacement if IPv6 isn't recognized
            ipaddr = req.headers["cf-pseudo-ipv4"];
        else if(ipaddr == null || !isValidIP(ipaddr))
            ipaddr = "err_no_IP";
    }

    if((ipaddr == "err_no_IP" || ipaddr == null) && typeof req.headers["cf-ipcountry"] == "string")
        ipaddr = `err_no_IP::${req.headers["cf-ipcountry"]}`;
    else if(ipaddr == null)
        ipaddr = "err_no_IP"

    ipaddr = (ipaddr.length < 15 ? ipaddr : (ipaddr.substr(0,7) === "::ffff:" ? ipaddr.substr(7) : ipaddr));

    try
    {
        if(settings.httpServer.ipHashing.enabled && isValidIP(ipaddr))
            ipaddr = hashIP(ipaddr);

        return typeof ipaddr == "string" ? ipaddr : ipaddr.toString();
    }
    catch(err)
    {
        if(typeof req.headers["cf-ipcountry"] == "string")
            return `err_couldnt_hash::${req.headers["cf-ipcountry"]}`;
        else
            return "err_couldnt_hash";
    }
};

/**
 * Checks if an IP is local or not (`localhost`, `127.0.0.1`, `::1`, etc.)
 * @param {String} ip
 * @param {Boolean} [inputIsHashed=true] If the input IP is not hashed, set this to false
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

const ipv4regex = settings.httpServer.regexes.ipv4;
const ipv6regex = settings.httpServer.regexes.ipv6;

/**
 * Checks whether or not an IP address is valid
 * @param {String} ip
 * @returns {Boolean}
 */
const isValidIP = ip => (ip.match(ipv4regex) || ip.match(ipv6regex));

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
