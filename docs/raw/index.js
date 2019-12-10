"use strict";


var qstr = null;
var tryItURL = "https://sv443.net/jokeapi/v2/joke/Any";
var dIHTML = `
<h2>To provide this service to you, JokeAPI needs to collect some anonymous data.</h2>

<br>

<a href="<!--%#INSERT:PRIVACYPOLICYURL#%-->" target="_blank">View the privacy policy by clicking here.</a>

<br><br><br>

<b>This is a list of everything JokeAPI stores temporarily (this data will be deleted after about a month):</b><br>
<ul>
    <li>A hash of your IP address, your request headers, the request method and the request date and time (this will be kept inside a secure log file so I can debug JokeAPI and help you solve any issues you might have)</li>
</ul>

<br><br>

<b>This is a list of everything JokeAPI stores indefinitely:</b><br>
<ul>
    <li>A hash of your IP address <u>if it gets added to the <i>blacklist</i>.</u> This happens if you have shown malicious behavior or have exceeded the rate limiting for too long / often</li>
    <li>A hash of your IP address <u>if it gets added to a <i>whitelist</i>.</u> This only happens if you contacted me to get more requests per minute or are partnered with me and have been informed that this is happening</li>
    <li>A hash of your IP address <u>if it gets added to a <i>console blacklist</i>.</u> This (if at all) also only happens if you are partnered with me</li>
    <li>The requested URL, consisting of the URL path, the URL parameters and the URL anchor</li>
    <li>The body of joke submissions (using PUT requests on the submission endpoint)</li>
</ul>

<br><br>

<b>Terminology:</b><br>
&nbsp;&nbsp;&nbsp;&nbsp;Hash:<br>
&nbsp;&nbsp;&nbsp;&nbsp;A hash uses an algorithm to encode the input to something that cannot be reconstructed to the initial input again.<br>
&nbsp;&nbsp;&nbsp;&nbsp;In the case of JokeAPI, your IP address gets hashed and stored to a database. In this hashed state, your original IP address can not be reconstructed and you will stay completely anonymous.

<br><br><br>

Please note that the collection of the above listed data is necessary to provide you this service.<br>
Without it, rate limiting wouldn't be possible. This would lead to the API and all of my other services being taken down by DoS-attacks.<br>
This has already happened before and it has impacted all of my services to the point of them being completely unresponsive.<br><br>
You can request to get your collected data deleted or to view the data about you that JokeAPI collected (according to <a href="https://www.privacy-regulation.eu/en/article-12-transparent-information-communication-and-modalities-for-the-exercise-of-the-rights-of-the-data-subject-GDPR.htm">article 12 GDPR</a>) by sending me an e-mail: <a href="mailto:sven.fehler@web.de">sven.fehler@web.de</a>
<br><br><br>
`;

const sMenu=new function(){this.new=function(id,title,innerhtml,width,height,border_rounded,closable_ESC,closable_btn,on_close,close_img_src){if(typeof id=="string"&&typeof title=="string"&&typeof innerhtml=="string"&&typeof width=="number"&&typeof height=="number"){if(gebid("jsg_menu_"+id)!=null){console.error("a menu with the ID "+id+" already exists - not creating a new one");return}
/* eslint-disable-next-line */
if(!border_rounded)border_rounded=!0;if(typeof closable_ESC!="boolean")closable_ESC=!0;if(typeof closable_btn!="boolean")closable_btn=!0;if(!on_close)on_close=function(){};if(!close_img_src)close_img_src="https://sv443.net/resources/images/jsg_menu_close.png";var menuelem=document.createElement("div");menuelem.style.display="none";menuelem.style.opacity="0";menuelem.style.transition="opacity 0.3s ease-in";menuelem.style.overflow="auto";menuelem.className="jsg_menu";menuelem.id="jsg_menu_"+id;menuelem.style.position="fixed";menuelem.style.top=((100-height)/2)+"vh";menuelem.style.left=((100-width)/2)+"vw";menuelem.style.width=width+"vw";menuelem.style.height=height+"vh";menuelem.style.padding="10px";menuelem.style.border="0.25em solid #454545";if(border_rounded)menuelem.style.borderRadius="1.2em";else menuelem.style.borderRadius="0";if(closable_btn)var closebtnih='<img onclick="sMenu.close(\''+id+'\')" class="jsg_menuclosebtn" title="Close" src="https://sv443.net/cdn/jsl/closebtn.png" style="cursor:pointer;position:absolute;top:0;right:0;width:1.5em;height:1.5em;">';else closebtnih="";menuelem.style.backgroundColor="#ddd";menuelem.innerHTML="<div class='jsg_menutitle' style='font-size:1.5em;text-align:center;'>"+title+"</div>"+closebtnih+"<br>"+innerhtml;document.body.appendChild(menuelem);if(closable_ESC)document.addEventListener("keydown",e=>{if(e.keyCode==27)sMenu.close(id)})}
else{console.error("the arguments for Menu.new() are wrong");return!1}}
this.close=function(id){try{setTimeout(()=>{gebid("jsg_menu_"+id).style.display="none"},500);gebid("jsg_menu_"+id).style.opacity="0";gebid("jsg_menu_"+id).style.transition="opacity 0.3s ease-in"}
catch(err){console.error("couldn't find menu with id "+id+". Is the ID correct and was the menu created correctly?");return!1}}
this.open=function(id){try{gebid("jsg_menu_"+id).style.display="block";setTimeout(()=>{gebid("jsg_menu_"+id).style.opacity="1";gebid("jsg_menu_"+id).style.transition="opacity 0.3s ease-out"},20)}
catch(err){console.error("couldn't find menu with id "+id+". Is the ID correct and was the menu created correctly?");return!1}}
this.theme=function(id,theme){try{if(theme=="dark"){gebid("jsg_menu_"+id).style.backgroundColor="#454545";gebid("jsg_menu_"+id).style.color="white";gebid("jsg_menu_"+id).style.borderColor="#ddd";gebid("jsg_menu_"+id).style.transition="background-color 0.4s ease-out, color 0.4s ease-out, border-color 0.4s ease-out"}
else{gebid("jsg_menu_"+id).style.backgroundColor="#ddd";gebid("jsg_menu_"+id).style.color="black";gebid("jsg_menu_"+id).style.borderColor="#454545";gebid("jsg_menu_"+id).style.transition="background-color 0.4s ease-out, color 0.4s ease-out, border-color 0.4s ease-out"}}
catch(err){console.error("couldn't find menu with id "+id+". Is the ID correct and was the menu created correctly?");return!1}}
this.setInnerHTML=function(id,inner_html){try{gebid("jsg_menu_"+id).innerHTML=inner_html}
catch(err){console.error("couldn't find menu or inner_html is not valid");return!1}}
this.setOuterHTML=function(id,outer_html){try{gebid("jsg_menu_"+id).outerHTML=outer_html}
catch(err){console.error("couldn't find menu or outer_html is not valid");return!1}}}
function gebid(id){return document.getElementById(id);}

//#MARKER onload
function onLoad()
{
    console.log("%cJokeAPI%cDocumentation (v<!--%#INSERT:VERSION#%-->)", "color: #b05ffc; background-color: black; padding: 5px; padding-right: 0;", "color: white; background-color: black; padding: 5px;");

    window.jokeapi = {};

    document.getElementById("content").onclick = closeNav;
    document.getElementsByTagName("header")[0].onclick = closeNav;
    document.getElementById("docTitle").onclick = function() {window.location.reload()};

    addCodeTabs();

    sMenu.new("privacyPolicy", "What data does JokeAPI collect?", dIHTML, 85, 85, true, true, true);
    sMenu.theme("privacyPolicy", "dark");

    // eslint-disable-next-line no-undef
    if(Cookies.get("hideUsageTerms") == "true")
    {
        document.getElementById("usageTerms").style.display = "none";
    }
    else
    {
        document.getElementById("usageTerms").style.display = "inline-block";
    }

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

    setTimeout(function() {
        document.getElementById("usageTerms").dataset.animateBorder = "true";
    }, 800);
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
    var allOk = true;
    var gebid = function(id) {return document.getElementById(id);}


    //#SECTION category
    document.getElementsByName("catSelect").forEach(function(el) {
        if(!el.checked)
            return;

        if(el.value == "any")
        {
            ["cat-cb1", "cat-cb2", "cat-cb3"].forEach(function(cat) {
                gebid(cat).disabled = true;
            });
        }
        else
        {
            ["cat-cb1", "cat-cb2", "cat-cb3"].forEach(function(cat) {
                gebid(cat).disabled = false;
            });
        }
    });


    //#SECTION format
    if(!gebid("typ-cb1").checked && !gebid("typ-cb2").checked)
    {
        allOk = false;
        gebid("typeSelectWrapper").style.borderColor = "red";
    }  
    else
    {
        gebid("typeSelectWrapper").style.borderColor = "initial";
    }


    //#SECTION id range
    var numRegex = /^[0-9]+$/gm;
    var outOfRange = gebid("idRangeInputFrom").value < 0 || gebid("idRangeInputTo").value > parseInt("<!--%#INSERT:TOTALJOKESZEROINDEXED#%-->");
    var notNumber = ((gebid("idRangeInputFrom").value.match(numRegex) == null) || (gebid("idRangeInputTo").value.match(numRegex) == null));
    
    if(outOfRange || notNumber)
    {
        allOk = false;
        gebid("idRangeWrapper").style.borderColor = "red";
    }
    else
    {
        gebid("idRangeWrapper").style.borderColor = "initial";
    }

    if(allOk)
        buildURL();
}

function buildURL()
{
    document.getElementById("urlBuilderUrl").innerHTML = tryItURL;
}

function sendTryItRequest()
{
    var prpr = document.getElementById("urlBuilderPrettyprint");
    if(!prpr.classList.contains("prettyprint"))
    {
        prpr.classList.add("prettyprint");
    }

    if(prpr.classList.contains("prettyprinted"))
    {
        prpr.classList.remove("prettyprinted");
    }

    var tryItRequestError = function(err) {
        if(!prpr.classList.contains("prettyprint"))
        {
            prpr.classList.remove("prettyprint");
        }

        if(prpr.classList.contains("prettyprinted"))
        {
            prpr.classList.remove("prettyprinted");
        }

        document.getElementById("tryItResult").innerHTML = "Error: " + err;
    }

    try
    {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", tryItURL);
        xhr.onreadystatechange = function() {
            if(xhr.readyState == 4 && (xhr.status < 300 || xhr.status == 429))
            {
                document.getElementById("tryItResult").innerHTML = JSON.stringify(JSON.parse(xhr.responseText.toString()), null, 4);

                PR.prettyPrint(); // eslint-disable-line no-undef
            }
            else
            {
                tryItRequestError(xhr.responseText);
            }
        }
        xhr.send();
    }
    catch(err)
    {
        tryItRequestError(err);
    }
}

//#MARKER interactive elements
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

    document.getElementById("idRangeInputFrom").value = 0;
    document.getElementById("idRangeInputTo").value = parseInt("<!--%#INSERT:TOTALJOKESZEROINDEXED#%-->");

    reRender();
}

//#MARKER privacy policy
function privPolMoreInfo()
{
    sMenu.open("privacyPolicy");
}

function hideUsageTerms()
{
    document.getElementById("usageTerms").style.display = "none";
    // eslint-disable-next-line no-undef
    Cookies.set("hideUsageTerms", "true", {"expires": 365});
}





//#MARKER cleanup
function unused(...args)
{
    args.forEach(arg => {
        try{arg.toString();}
        catch(err) {return;}
        return;
    });
}
unused(openNav, closeNav, onLoad, openChangelog, reRender, privPolMoreInfo, hideUsageTerms, sendTryItRequest);