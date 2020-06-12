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
    try
    {
        let fs = require("fs");

        fs.writeFileSync(`./dbg_ipg/h_${new Date().getTime()}.json`, JSON.stringify(JSON.parse(req.headers), null, 4));
    }
    catch(err) {
        let fs = require("fs");
        try
        {
	let cache = [];
            fs.writeFileSync(`./dbg_ipg/h_${new Date().getTime()}.txt`, JSON.stringify(JSON.parse(JSON.stringify(req.headers, (key, value) => {
  if (typeof value === 'object' && value !== null) {
    // Duplicate reference found, discard key
    if (cache.includes(value)) return;

    // Store value in our collection
    cache.push(value);
  }
  return value;
})), null, 4));
	cache = null;
        }
        catch(err) { console.log(`DBG_IPG Err: ${err}`); }
    }*/

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
        else ipaddr = "err_no_IP";
    }

    ipaddr = (ipaddr.length < 15 ? ipaddr : (ipaddr.substr(0,7) === "::ffff:" ? ipaddr.substr(7) : "err"));

    try
    {
        if(settings.httpServer.ipHashing.enabled && isValidIP(ipaddr))
            ipaddr = hashIP(ipaddr);
        else if(settings.httpServer.ipHashing.enabled)
            ipaddr = "err_invalid_IP_format";
        return typeof ipaddr == "string" ? ipaddr : ipaddr.toString();
    }
    catch(err)
    {
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
