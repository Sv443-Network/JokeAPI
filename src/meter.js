// handles custom metering / monitoring values in pm2

const io = require("@pm2/io");
const fs = require("fs-extra");

const debug = require("./debug");
const settings = require("../settings");

/**
 * @typedef {"req1min"|"req10mins"|"req1hour"|"reqtotal"|"submission"} MeterName
 */


var meters = {
    req1mMeter: null,
    req10mMeter: null,
    req1hMeter: null,
    reqtotalMeter: null,
    submissionMeter: null
}

var values = {
    /** Requests per 1 minute */
    m1: 0,
    /** Requests per 10 minutes */
    m10: 0,
    /** Requests per 1 hour */
    h1: 0,
    /** Total requests */
    tot: 0,
    /** Total submissions */
    subms: 0
}

/**
 * Initializes the meter module
 * @returns {Promise}
 */
function init()
{
    return new Promise((resolve, reject) => {
        try
        {
            meters.req1mMeter = io.metric({
                name: "Reqs / 1m",
                unit: "req"
            });
            meters.req1mMeter.set(-1);
            setInterval(() => {
                meters.req1mMeter.set(values.m1);
                values.m1 = 0;
            }, 1000 * 60);


            meters.req10mMeter = io.metric({
                name: "Reqs / 10m",
                unit: "req"
            });
            meters.req10mMeter.set(-1);
            setInterval(() => {
                meters.req10mMeter.set(values.m10);
                values.m10 = 0;
            }, 1000 * 60 * 10);


            meters.req1hMeter = io.metric({
                name: "Reqs / 1h",
                unit: "req"
            });
            meters.req1hMeter.set(-1);
            setInterval(() => {
                meters.req1hMeter.set(values.h1);
                values.h1 = 0;
            }, 1000 * 60 * 60);


            meters.reqtotalMeter = io.metric({
                name: "Total Reqs",
                unit: "req"
            });
            meters.reqtotalMeter.set(-1);


            meters.submissionMeter = io.metric({
                name: "Submissions",
                unit: "sub"
            });
            values.subms = fs.readdirSync(settings.jokes.jokeSubmissionPath).length;
            meters.submissionMeter.set(values.subms);
            setInterval(() => {
                values.subms = fs.readdirSync(settings.jokes.jokeSubmissionPath).length;
                meters.submissionMeter.set(values.subms);
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
 * Increments a meter's value
 * @param {MeterName} meterName
 * @param {number} [addValue] If left empty, the meter will update by `1`
 */
function update(meterName, addValue)
{
    if(typeof addValue == "undefined")
        addValue = 1;
        
    if(typeof addValue != "number")
        throw new TypeError(`meter.update(): "addValue" has wrong type "${typeof addValue}" - expected "number"`);

    debug("Meter", `Updating meter "${meterName}" - adding ${addValue}`);

    switch(meterName)
    {
        case "req1min":
            values.m1 += addValue;
        break;
        case "req10min":
            values.m10 += addValue;
        break;
        case "req1hour":
            values.h1 += addValue;
        break;
        case "reqtotal":
            values.tot += addValue;
            meters.reqtotalMeter.set(values.tot);
        break;
        case "submission":
            values.subms += addValue;
            meters.submissionMeter.set(values.subms);
        break;
        default:
            throw new TypeError(`meter.update(): "meterName" has incorrect value`);
    }

    return;
}

module.exports = { init, update };
