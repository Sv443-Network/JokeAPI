const jsl = require("svjsl");

/**
 * 
 * @param {("error"|"ratelimit"|"fatal")} type 
 * @param {*} content 
 * @param {*} timestamp 
 */
const logger = (type, content, timestamp) => {
    try
    {
        timestamp = jsl.isEmpty(timestamp) || typeof timestamp != "boolean" ? true: timestamp;

        let errorType = "";
        let errorContent = "";

        switch(type)
        {
            case "error":
            case "ratelimit":
            case "fatal":
                errorType = type;
                errorContent = content;
            break;
            default:
                errorType = "fatal";
                errorContent = `Error while logging - wrong type ${type} specified.\nContent of the error: ${content}`;
            break;
        }
    }
    catch(err)
    {

    }
};

module.exports = logger;