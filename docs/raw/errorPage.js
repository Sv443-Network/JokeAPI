document.addEventListener("DOMContentLoaded", function() {
    // eslint-disable-next-line no-undef
    let errorInfo = JSON.parse(Cookies.get("errorInfo"));

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

    document.title = ("<!--%#INSERT:NAME#%--> - Error " + statusCode);

    document.getElementById("errCodeDisplay").innerHTML = (statusCode + " - " + errorReasonMsg);
    document.getElementById("errDetailDisplay").innerHTML = errorInfo["API-Error-Message"];
});