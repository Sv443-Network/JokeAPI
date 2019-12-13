window.errorWrittenToPage = false;

document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        if(window.errorWrittenToPage != true)
        {
            setErrorDisp(500, "Internal Server Error", "Error while finding the error message - oh the irony");
        }
    }, 6000);

    try
    {
        let errorInfo = JSON.parse(Cookies.get("errorInfo")); // eslint-disable-line no-undef

        let statusCode = parseInt(errorInfo["API-Error-StatusCode"]);
        let errorReasonMsg = "";

        switch(statusCode)
        {
            case 404:
                errorReasonMsg = "Not Found";
            break;
            case 500: default:
                errorReasonMsg = "Internal Server Error";
            break;
        }

        setErrorDisp(parseInt(statusCode), errorReasonMsg, errorInfo["API-Error-Message"]);
    }
    catch(err)
    {
        setErrorDisp(500, "Internal Server Error", "Error while finding the error message - oh the irony");
    }
});

/**
 * Sets the error display of the page
 * @param {Number} code 
 * @param {String} summary
 * @param {String} details 
 */
function setErrorDisp(code = 500, summary = "Internal Server Error", details = "No details provided")
{
    window.errorWrittenToPage = true;
    document.title = ("<!--%#INSERT:NAME#%--> - Error " + code.toString());
    document.getElementById("errCodeDisplay").innerHTML = (code.toString() + " - " + summary);
    document.getElementById("errDetailDisplay").innerHTML = details;
}