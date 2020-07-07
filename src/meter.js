// handles custom metering / monitoring values in pm2

const io = require("@pm2/io");
const fs = require("fs-extra");

const debug = require("./verboseLogging");
const settings = require("../settings");

var req1mMeter = null;
var req10mMeter = null;
var req1hMeter = null;
var reqtotalMeter = null;
var submissionMeter = null;
var m1 = 0;
var m10 = 0;
var h1 = 0;
var tot = 0;
var subms = 0;

/**
 * Initializes the meter module
 * @returns {Promise}
 */
function init()
{
    return new Promise((resolve, reject) => {
        try
        {
            req1mMeter = io.metric({
                name: "Reqs / 1m",
                unit: "req"
            });
            req1mMeter.set(-1);
            setInterval(() => {
                req1mMeter.set(m1);
                m1 = 0;
            }, 1000 * 60);


            req10mMeter = io.metric({
                name: "Reqs / 10m",
                unit: "req"
            });
            req10mMeter.set(-1);
            setInterval(() => {
                req10mMeter.set(m10);
                m10 = 0;
            }, 1000 * 60 * 10);


            req1hMeter = io.metric({
                name: "Reqs / 1h",
                unit: "req"
            });
            req1hMeter.set(-1);
            setInterval(() => {
                req1hMeter.set(h1);
                h1 = 0;
            }, 1000 * 60 * 60);


            reqtotalMeter = io.metric({
                name: "Total Reqs",
                unit: "req"
            });
            reqtotalMeter.set(-1);


            submissionMeter = io.metric({
                name: "Submissions",
                unit: "sub"
            });
            subms = fs.readdirSync(settings.jokes.jokeSubmissionPath).length;
            submissionMeter.set(subms);
            setInterval(() => {
                subms = fs.readdirSync(settings.jokes.jokeSubmissionPath).length;
                submissionMeter.set(subms);
            }, 1000 * 60 * 10);
        }
        catch(err)
        {
            return reject(err);
        }

        return resolve();
    });
}

/**
 * Adds a number to a meter
 * @param {"req1min"|"req10mins"|"req1hour"|"reqtotal"|"submission"} meterName
 * @param {Number|undefined} addValue
 */
function update(meterName, addValue)
{
    if(typeof addValue == "undefined")
        addValue = 1;

    debug("Meter", `Updating meter ${meterName} - adding value ${addValue}`);
    
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
        case "req1hour":
            h1 += addValue;
        break;
        case "reqtotal":
            tot += addValue;
            reqtotalMeter.set(tot);
        break;
        case "submission":
            subms += addValue;
            submissionMeter.set(subms);
        break;
        default:
            throw new Error(`meter.update(): "meterName" has incorrect value`);
    }

    return;
}

module.exports = { init, update };
