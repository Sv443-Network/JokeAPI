var qstr = null;


function onLoad()
{
    console.log("%cJokeAPI%cDocumentation (v<!--%#INSERT:VERSION#%-->)", "color: #b05ffc; background-color: black; padding: 5px; padding-right: 0;", "color: white; background-color: black; padding: 5px;");

    window.jokeapi = {};

    document.getElementById("content").onclick = closeNav;
    document.getElementsByTagName("header")[0].onclick = closeNav;
    document.getElementById("docTitle").onclick = function() {window.location.reload()};

    addCodeTabs();

    try
    {
        // put ES6+ code here
        qstr = getQueryStringObject();

        if(qstr != null && qstr["devFeatures"] == "true")
            document.getElementById("devStuff").style.display = "inline-block";
    }
    catch(err) {unused();}

    document.addEventListener("keyup", e => {
        if(e.key == "m")
        {
            if(window.jokeapi.sidenavOpened)
                closeNav();
            else openNav();
        }
        else if(e.key == "Escape" && window.jokeapi.sidenavOpened)
            closeNav();
    });

    resetTryItForm();
}

function addCodeTabs()
{
    var codeElements = document.getElementsByTagName("code");

    for(var i = 0; i < codeElements; i++)
    {
        if(codeElements[i].classList.contains("prettyprint"))
            codeElements[i].innerHTML = codeElements[i].innerHTML.replace(/&tab;/gm, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
}

function unused(...args)
{
    args.forEach(arg => {
        try{arg.toString();}
        catch(err) {return;}
        return;
    });
}

//#MARKER SideNav
function openNav()
{
    setTimeout(function() {
        document.body.dataset["sidenav"] = "opened";
    }, 50);

    window.jokeapi.sidenavOpened = true;

    document.getElementById("sidenav").style.width = "280px";
    document.getElementById("content").style.marginLeft= "280px";
    document.getElementsByTagName("header")[0].dataset["grayscaled"] = "true";
    document.getElementById("sideNavOpen").style.visibility = "hidden";
}
  
function closeNav()
{
    if(document.body.dataset["sidenav"] != "opened")
        return;

    window.jokeapi.sidenavOpened = false;

    document.body.dataset["sidenav"] = "closed";

    document.getElementById("sidenav").style.width = "0";
    document.getElementById("content").style.marginLeft= "10px";
    document.getElementsByTagName("header")[0].dataset["grayscaled"] = "false";
    document.getElementById("sideNavOpen").style.visibility = "visible";
}

function getQueryStringObject()
{
    var qstrObj = {};

    if(!window.location.href.includes("?"))
        return null;

    var rawQstr = window.location.href.split("?")[1];
    var qstrArr = [];

    if(rawQstr.includes("#"))
        rawQstr = rawQstr.split("#")[0];

    if(rawQstr != null && rawQstr.includes("&"))
        qstrArr = rawQstr.split("&");
    else if(rawQstr != null)
        qstrArr = [rawQstr];
    else return null;


    if(qstrArr.length > 0)
        qstrArr.forEach(qstrEntry => {
            if(qstrEntry.includes("="))
                qstrObj[qstrEntry.split("=")[0]] = qstrEntry.split("=")[1];
        });
    else return null;

    return qstrObj;
}

function openChangelog()
{
    //TODO:
    unused();
}

function reRender()
{
    document.getElementsByName("catSelect").forEach(function(el) {
        if(!el.checked)
            return;

        if(el.value == "any")
        {
            ["cat-cb1", "cat-cb2", "cat-cb3"].forEach(function(cat) {
                document.getElementById(cat).disabled = true;
            });
        }
        else
        {
            ["cat-cb1", "cat-cb2", "cat-cb3"].forEach(function(cat) {
                document.getElementById(cat).disabled = false;
            });
        }
    });
}

function resetTryItForm()
{
    ["cat-cb1", "cat-cb2", "cat-cb3"].forEach(function(cat) {
        document.getElementById(cat).checked = false;
    });

    document.getElementById("cat-radio1").checked = true;

    ["blf-cb1", "blf-cb2", "blf-cb3", "blf-cb4", "blf-cb5"].forEach(function(flg) {
        document.getElementById(flg).checked = false;
    });

    document.getElementById("fmt-cb1").checked = true;

    ["typ-cb1", "typ-cb2"].forEach(function(type) {
        document.getElementById(type).checked = true;
    });

    reRender();
}





//#MARKER cleanup
unused(openNav, closeNav, onLoad, openChangelog, reRender);