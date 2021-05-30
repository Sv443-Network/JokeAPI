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
        let errorSubtext = "";

        switch(statusCode)
        {
            case 404:
                errorReasonMsg = "Not Found";
                errorSubtext = "<!--%#INSERT:NAME#%--> couldn't find a resource that corresponds to the URL you have entered.<br>Please make sure the URL is correct or <a href=\"<!--%#INSERT:DOCSURL#%-->\">visit the documentation by clicking here</a>.";
            break;
            case 500: default:
                errorReasonMsg = "Internal Server Error";
                errorSubtext = "<!--%#INSERT:NAME#%--> encountered an unexpected internal error.<br>If this error persists and error details were provided on this page, please <a href=\"<!--%#INSERT:AUTHORWEBSITEURL#%-->\">contact me</a> with the error details and I will try to fix it and/or help you.<br>Alternatively, <a href=\"<!--%#INSERT:DOCSURL#%-->\">visit the documentation by clicking here</a>.";
            break;
        }

        setErrorDisp(parseInt(statusCode), errorReasonMsg, errorInfo["API-Error-Message"], errorSubtext);
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
 * @param {String} subText
 */
function setErrorDisp(code = 500, summary = "Internal Server Error", details = "No details provided", subText = "")
{
    window.errorWrittenToPage = true;
    document.title = ("<!--%#INSERT:NAME#%--> - Error " + code.toString());
    document.getElementById("errCodeDisplay").innerHTML = (code.toString() + " - " + summary);
    document.getElementById("errDetailDisplay").innerHTML = "Details: " + decodeURIComponent(details);

    if(subText)
        document.getElementById("errSubText").innerHTML = subText;
}
