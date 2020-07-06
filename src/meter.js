// handles custom metering / monitoring values in pm2

const io = require("@pm2/io");
const fs = require("fs-extra");

const settings = require("../settings");

var req1mMeter = null;
var req10mMeter = null;
var reqtotalMeter = null;
var reqBlMeter = null;
var submissionMeter = null;
var m1 = 0;
var m10 = 0;
var tot = 0;
var bl = 0;
var subms = 0;

/**
 * Initializes this module
 */
function init()
{
    req1mMeter = io.metric({
        name: "Reqs / 1m",
        unit: "rpm"
    });
    req1mMeter.set(0);
    setInterval(() => {
        req1mMeter.set(m1);
        m1 = 0;
    }, 1000 * 60);


    req10mMeter = io.metric({
        name: "Reqs / 10m",
        unit: "rpt"
    });
    req10mMeter.set(0);
    setInterval(() => {
        req10mMeter.set(m10);
        m10 = 0;
    }, 1000 * 60 * 10);


    reqtotalMeter = io.metric({
        name: "Total Reqs",
        unit: "ttl"
    });
    reqtotalMeter.set(0);


    reqBlMeter = io.metric({
        name: "Blacklisted Reqs",
        unit: "blr"
    });
    reqBlMeter.set(0);


    submissionMeter = io.metric({
        name: "Submissions",
        unit: "sbm"
    });
    subms = fs.readdirSync(settings.jokes.jokeSubmissionPath).length;
    submissionMeter.set(subms);
}

/**
 * Adds a number to a meter
 * @param {"req1min"|"req10mins"|"reqtotal"|"blacklisted"|"submission"} meterName
 * @param {Number} addValue
 */
function update(meterName, addValue)
{
    if(typeof addValue == "undefined")
        addValue = 1;

    if(typeof addValue != "number")
        throw new TypeError(`meter.update(): "addValue" has wrong type "${typeof addValue}" - expected "number"`);

    switch(meterName)
    {
        case "req1min":
            m1 += addValue;
        break;
        case "req10min":
            m10 += addValue;
        break;
        case "reqtotal":
            tot += addValue;
            reqtotalMeter.set(tot);
        break;
        case "blacklisted":
            bl += addValue;
            submissionMeter.set(bl);
        break;
        case "submission":
            subms += addValue;
            submissionMeter.set(subms);
        break;
        default:
            throw new Error(`meter.update(): "meterName" has incorrect value`);
    }
}

module.exports = { init, update };
