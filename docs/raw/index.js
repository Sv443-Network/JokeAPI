"use strict";

var settings = {
    baseURL: "<!--%#INSERT:DOCSURL#%-->",
    // baseURL: "http://127.0.0.1:8076/", // DEBUG
    jokeEndpoint: "joke",
    anyCategoryName: "Any",
    defaultFormat: "json",
    submitUrl: "<!--%#INSERT:DOCSURL#%-->/submit",
    // submitUrl: "http://127.0.0.1:8076/submit", // DEBUG
    defaultLang: "en",
    formatVersion: 3,
    contributorsObject: JSON.parse('<!--%#INSERT:CONTRIBUTORS#%-->'),
    categoryAliasesObject: JSON.parse('<!--%#INSERT:CATEGORYALIASES#%-->')
};

var submission = {};

if(settings.baseURL.endsWith("/"))
{
    settings.baseURL = settings.baseURL.substr(0, (settings.baseURL.length - 1));
}

var tryItOk = false;
var tryItURL = "";
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
    <li>The payload of joke submissions (using PUT requests on the submission endpoint)</li>
</ul>

<br><br>

<b>Terminology:</b><br>
&nbsp;&nbsp;&nbsp;&nbsp;Hash:<br>
&nbsp;&nbsp;&nbsp;&nbsp;A hash uses an algorithm to encrypt the input to something that cannot be reconstructed to the initial input again.<br>
&nbsp;&nbsp;&nbsp;&nbsp;In the case of JokeAPI, your IP address gets hashed and stored to a database.<br>
&nbsp;&nbsp;&nbsp;&nbsp;In this hashed state, your original IP address can not be reconstructed and you will stay completely anonymous in case any data ever gets leaked, while JokeAPI can still uniquely identify you.

<br><br><br>

Please note that the collection of the above listed data is necessary to provide you this service.<br>
Without it, rate limiting wouldn't be possible. This would lead to the API and all of my other services being taken down by DoS-attacks.<br>
This has already happened before and it has impacted all of my services to the point of them being completely unresponsive.<br><br>
You can request to get your collected data deleted or to view the data about you that JokeAPI collected (according to <a href="https://www.privacy-regulation.eu/en/article-12-transparent-information-communication-and-modalities-for-the-exercise-of-the-rights-of-the-data-subject-GDPR.htm">article 12 GDPR</a>) by sending me an e-mail: <a href="mailto:contact@sv443.net">contact@sv443.net</a>
<br><br><br>
`;

var rsIHTML = `
<form onsubmit="submitRestartForm()">
<input type="password" id="restartFormToken" placeholder="Restart Token" style="width:30vw"> <button type="submit">Send &gt;</button>
</form>
`;

var sMenu=new function(){this.new=function(id,title,innerhtml,width,height,border_rounded,closable_ESC,closable_btn,on_close,close_img_src){if(typeof id=="string"&&typeof title=="string"&&typeof innerhtml=="string"&&typeof width=="number"&&typeof height=="number"){if(gebid("jsg_menu_"+id)!=null){console.error("a menu with the ID "+id+" already exists - not creating a new one");return}
/* eslint-disable-next-line */
if(!border_rounded)border_rounded=!0;if(typeof closable_ESC!="boolean")closable_ESC=!0;if(typeof closable_btn!="boolean")closable_btn=!0;if(!on_close)on_close=function(){};if(!close_img_src)close_img_src="https://sv443.net/resources/images/jsg_menu_close.png";var menuelem=document.createElement("div");menuelem.style.display="none";menuelem.style.opacity="0";menuelem.style.transition="opacity 0.3s ease-in";menuelem.style.overflow="auto";menuelem.className="jsg_menu";menuelem.id="jsg_menu_"+id;menuelem.style.position="fixed";menuelem.style.top=((100-height)/2)+"vh";menuelem.style.left=((100-width)/2)+"vw";menuelem.style.width=width+"vw";menuelem.style.height=height+"vh";menuelem.style.padding="10px";menuelem.style.border="2px solid #454545";if(border_rounded)menuelem.style.borderRadius="1.2em";else menuelem.style.borderRadius="0";if(closable_btn)var closebtnih='<img onclick="sMenu.close(\''+id+'\')" class="jsg_menuclosebtn" title="Close" src="https://sv443.net/cdn/jsl/closebtn.png" style="cursor:pointer;position:absolute;top:0;right:0;width:1.5em;height:1.5em;">';else closebtnih="";menuelem.style.backgroundColor="#ddd";menuelem.innerHTML="<div class='jsg_menutitle' style='font-size:1.5em;text-align:center;'>"+title+"</div>"+closebtnih+"<br>"+innerhtml;document.body.appendChild(menuelem);if(closable_ESC)document.addEventListener("keydown",function(e){if(e.keyCode==27)sMenu.close(id)})}
else{console.error("the arguments for Menu.new() are wrong");return!1}}
this.close=function(id){try{setTimeout(function(){gebid("jsg_menu_"+id).style.display="none"},500);gebid("jsg_menu_"+id).style.opacity="0";gebid("jsg_menu_"+id).style.transition="opacity 0.3s ease-in"}
catch(err){console.error("couldn't find menu with id "+id+". Is the ID correct and was the menu created correctly?");return!1}}
this.open=function(id){try{gebid("jsg_menu_"+id).style.display="block";setTimeout(function(){gebid("jsg_menu_"+id).style.opacity="1";gebid("jsg_menu_"+id).style.transition="opacity 0.3s ease-out"},20)}
catch(err){console.error("couldn't find menu with id "+id+". Is the ID correct and was the menu created correctly?");return!1}}
this.theme=function(id,theme){try{if(theme=="dark"){gebid("jsg_menu_"+id).style.backgroundColor="#454545";gebid("jsg_menu_"+id).style.color="white";gebid("jsg_menu_"+id).style.borderColor="#ddd";gebid("jsg_menu_"+id).style.transition="background-color 0.4s ease-out, color 0.4s ease-out, border-color 0.4s ease-out"}
else{gebid("jsg_menu_"+id).style.backgroundColor="#ddd";gebid("jsg_menu_"+id).style.color="black";gebid("jsg_menu_"+id).style.borderColor="#454545";gebid("jsg_menu_"+id).style.transition="background-color 0.4s ease-out, color 0.4s ease-out, border-color 0.4s ease-out"}}
catch(err){console.error("couldn't find menu with id "+id+". Is the ID correct and was the menu created correctly?");return!1}}
this.setInnerHTML=function(id,inner_html){try{gebid("jsg_menu_"+id).innerHTML=inner_html}
catch(err){console.error("couldn't find menu or inner_html is not valid");return!1}}
this.setOuterHTML=function(id,outer_html){try{gebid("jsg_menu_"+id).outerHTML=outer_html}
catch(err){console.error("couldn't find menu or outer_html is not valid");return!1}}}
/**
 * Alias for document.getElementById()
 * @param {String} id ID of the element
 */
function gebid(id){return document.getElementById(id);}


var idRanges = {};
var maxJokeIdRange = parseInt("<!--%#INSERT:TOTALJOKESZEROINDEXED#%-->");


//#MARKER onload

function onLoad()
{
    window.jokeapi = {};

    console.log("%cJokeAPI%cDocumentation (v<!--%#INSERT:VERSION#%-->)  -  © Copyright Sv443 Network 2018-2020", "color: #b05ffc; background-color: black; padding: 5px; padding-right: 0; font-size: 1.2em;", "color: white; background-color: black; padding: 5px; font-size: 1.2em;");

    gebid("content").onclick = function(e){tryCloseSideNav(e)};
    document.getElementsByTagName("header")[0].onclick = function(e){tryCloseSideNav(e)};
    gebid("docTitle").onclick = function(){window.location.reload()};

    addCodeTabs();

    sMenu.new("privacyPolicy", "What data does JokeAPI collect?", dIHTML, 85, 85, true, true, true);
    sMenu.theme("privacyPolicy", "dark");

    sMenu.new("restartPrompt", "Restart <!--%#INSERT:NAME#%-->", rsIHTML, 40, 30, true, true, true);
    sMenu.theme("restartPrompt", "dark");


    // eslint-disable-next-line no-undef
    if(Cookies.get("hideUsageTerms") == "true")
    {
        gebid("usageTerms").style.display = "none";
    }
    else
    {
        gebid("usageTerms").style.display = "inline-block";
    }


    document.addEventListener("keydown", function(e) {
        if(e.key == "Escape" && window.jokeapi.sidenavOpened)
            closeNav();
        else if(e.key == "R" && e.altKey && e.shiftKey)
        {
            openRestartForm();
        }
    });

    resetTryItForm();

    setTimeout(function() {
        gebid("usageTerms").dataset.animateBorder = "true";
    }, 800);

    buildURL();

    gebid("content").addEventListener("click", function(e) {
        if(document.body.dataset["sidenav"] == "opened")
        {
            e.preventDefault();
            closeNav();
        }
    });

    var selectOnInitElems = document.getElementsByClassName("selectOnInit");

    for(var i = 0; i < selectOnInitElems.length; i++)
    {
        selectOnInitElems[i].selected = true;
    }

    var uncheckOnInitElems = document.getElementsByClassName("uncheckOnInit");
    for(var iii = 0; iii < uncheckOnInitElems.length; iii++)
    {
        uncheckOnInitElems[iii].checked = false;
    }

    var clearOnInitElems = document.getElementsByClassName("clearOnInit");
    for(var j = 0; j < clearOnInitElems.length; j++)
    {
        clearOnInitElems[j].value = "";
    }

    try
    {
        var fileFormats = JSON.parse('<!--%#INSERT:FILEFORMATARRAY#%-->');
        if(fileFormats.includes("JSON"))
        {
            fileFormats.splice(fileFormats.indexOf("JSON"), 1);
        }
        Array.from(document.getElementsByClassName("insFormatsS")).forEach(function(el) {
            el.innerText = fileFormats.join(" and ");
        });

        var flags = JSON.parse('<!--%#INSERT:FLAGSARRAY#%-->');
        Array.from(document.getElementsByClassName("insFlags")).forEach(function(el) {
            el.innerText = flags.join(", ");
        });

        var formats = JSON.parse('<!--%#INSERT:FILEFORMATARRAY#%-->');
        Array.from(document.getElementsByClassName("insFormats")).forEach(function(el) {
            el.innerText = formats.join(", ").toLowerCase();
        });

        var categories = JSON.parse('<!--%#INSERT:CATEGORYARRAY#%-->');
        Array.from(document.getElementsByClassName("insCategories")).forEach(function(el) {
            el.innerText = categories.join(", ");
        });
    }
    catch(err)
    {
        return alert("Documentation compilation was unsuccessful: Value insertion error:\n" + err);
    }
    
    //#SECTION submission form
    var inputElems = [
        "f_category",
        "f_type",
        "f_flags_nsfw",
        "f_flags_religious",
        "f_flags_political",
        "f_flags_racist",
        "f_flags_sexist",
        "f_flags_explicit",
        "f_setup",
        "f_delivery",
        "f_language"
    ];

    for(var ii = 0; ii < inputElems.length; ii++)
    {
        var elm = gebid(inputElems[ii]);

        if(elm.tagName.toLowerCase() != "textarea")
        {
            elm.onchange = function()
            {
                return valChanged(this);
            }
        }
        else
        {
            elm.oninput = function()
            {
                return valChanged(this);
            }
        }
    }

    var langXhr = new XMLHttpRequest();
    var langUrl = settings.baseURL + "/languages";
    var langSelectElems = document.getElementsByClassName("appendLangOpts");

    var otherOpt = document.createElement("option");
    otherOpt.innerText = "Other / Custom";
    otherOpt.value = "other";
    gebid("f_language").appendChild(otherOpt);

    var sysLangsText = "";
    var jokeLangsText = "";

    langXhr.open("GET", langUrl);
    langXhr.onreadystatechange = function() {
        var xErrElem;
        if(langXhr.readyState == 4 && langXhr.status < 300)
        {
            var respJSON = JSON.parse(langXhr.responseText.toString());
            var languagesArray = respJSON.jokeLanguages;

            sysLangsText = respJSON.systemLanguages.join(", ");
            jokeLangsText = respJSON.jokeLanguages.join(", ");

            for(var i = 0; i < languagesArray.length; i++)
            {
                for(var j = 0; j < langSelectElems.length; j++)
                {
                    var langName = "";

                    for(var k = 0; k < respJSON.possibleLanguages.length; k++)
                    {
                        if(respJSON.possibleLanguages[k].code == languagesArray[i])
                        {
                            langName = respJSON.possibleLanguages[k].name;
                        }
                    }

                    xErrElem = document.createElement("option");
                    xErrElem.value = languagesArray[i];
                    if(languagesArray[i] == settings.defaultLang)
                    {
                        xErrElem.selected = true;
                    }
                    xErrElem.innerText = languagesArray[i] + " - " + langName;

                    if(languagesArray[i] == settings.defaultLang)
                        xErrElem.selected = true;

                    langSelectElems[j].appendChild(xErrElem);
                    langSelectElems[j].value = settings.defaultLang;
                }
            }

            var sysLangsElems = document.getElementsByClassName("insSysLangs");
            var jokeLangsElems = document.getElementsByClassName("insJokeLangs");

            for(var sI = 0; sI < sysLangsElems.length; sI++)
            {
                sysLangsElems[sI].innerText = sysLangsText;
            }

            for(var jI = 0; jI < sysLangsElems.length; jI++)
            {
                jokeLangsElems[jI].innerText = jokeLangsText;
            }
        }
        else if(langXhr.readyState == 4 && langXhr.status >= 300)
        {
            for(var ii = 0; ii < langSelectElems.length; ii++)
            {
                xErrElem = document.createElement("option");
                xErrElem.value = "en";
                xErrElem.innerText = "en - English";
                xErrElem.selected = true;

                langSelectElems[ii].appendChild(xErrElem);
            }
        }
    };
    langXhr.send();


    var infoXhr = new XMLHttpRequest();
    infoXhr.open("GET", (settings.baseURL + "/info"));

    infoXhr.onreadystatechange = function() {
        if(infoXhr.readyState == 4 && infoXhr.status < 300)
        {
            var respJSON = JSON.parse(infoXhr.responseText.toString());

            var idrKeys = Object.keys(respJSON.jokes.idRange);
            for(var i = 0; i < idrKeys.length; i++)
            {
                var idrKey = idrKeys[i];
                idRanges[idrKey] = respJSON.jokes.idRange[idrKey];

                try
                {
                    console.info("<!--%#INSERT:NAME#%--> is serving " + (respJSON.jokes.idRange[idrKey][1] + 1) + " jokes from language \"" + idrKey + "\"");
                }
                catch(err)
                {
                    void(err);
                }
            }

            reRender();
        }
        else if(infoXhr.readyState == 4 && infoXhr.status >= 300)
        {
            console.error("Couldn't get ID range of all languages. Defaulting to the max possible value.");
        }
    };

    infoXhr.send();


    gebid("submitBtn").addEventListener("click", function() {
        submitJoke();
    });

    buildSubmission();
    setTimeout(function() { buildSubmission() }, 2000);

    gebid("insUserAgent").innerText = navigator.userAgent;

    gebid("lcodeSelect").value = settings.defaultLang;

    var abElems = document.getElementsByClassName("antiBotE");
    for(var l = 0; l < abElems.length; l++)
    {
        abElems[l].onclick = function()
        {
            if(!this.classList.contains("shown"))
            {
                this.innerText = atob(this.dataset.enc);
                this.classList.add("shown");
            }
        }
    }

    gebid("lcodeSelect").value = settings.defaultLang;
    gebid("lcodeSelect").onchange = function() { reRender(true) };
    gebid("sideNavOpen").onclick = function() { return openNav(); };


    loadCategoryAliases();
    loadContributors();
}

/**
 * @param {MouseEvent} e
 */
function tryCloseSideNav(e)
{
    if(document.body.dataset["sidenav"] == "opened")
    {
        e.preventDefault();
        closeNav();
    }
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
    console.info("opening nav");

    setTimeout(function() {
        document.body.dataset["sidenav"] = "opened";
    }, 50);

    window.jokeapi.sidenavOpened = true;

    gebid("sidenav").style.width = "280px";
    gebid("content").style.marginLeft = "280px";
    document.getElementsByTagName("header")[0].dataset["grayscaled"] = "true";
    gebid("sideNavOpen").style.visibility = "hidden";
}
  
function closeNav()
{
    console.info("closing nav");

    if(document.body.dataset["sidenav"] != "opened")
        return;

    window.jokeapi.sidenavOpened = false;

    document.body.dataset["sidenav"] = "closed";

    gebid("sidenav").style.width = "0";
    gebid("content").style.marginLeft = "10px";
    document.getElementsByTagName("header")[0].dataset["grayscaled"] = "false";
    gebid("sideNavOpen").style.visibility = "visible";
}

// function getQueryStringObject()
// {
//     var qstrObj = {};

//     if(!window.location.href.includes("?"))
//         return null;

//     var rawQstr = window.location.href.split("?")[1];
//     var qstrArr = [];

//     if(rawQstr.includes("#"))
//         rawQstr = rawQstr.split("#")[0];

//     if(rawQstr != null && rawQstr.includes("&"))
//         qstrArr = rawQstr.split("&");
//     else if(rawQstr != null)
//         qstrArr = [rawQstr];
//     else return null;


//     if(qstrArr.length > 0)
//         qstrArr.forEach(function(qstrEntry) {
//             if(qstrEntry.includes("="))
//                 qstrObj[qstrEntry.split("=")[0]] = qstrEntry.split("=")[1];
//         });
//     else return null;

//     return qstrObj;
// }

/**
 * @param {Boolean} [langChanged]
 */
function reRender(langChanged)
{
    console.info("Re-rendering try-it form");

    var allOk = true;

    //#SECTION category
    var isValid = false;
    document.getElementsByName("catSelect").forEach(function(el) {
        if(!el.checked)
            return;

        if(el.value == "any")
        {
            isValid = true;
            ["cat-cb1", "cat-cb2", "cat-cb3", "cat-cb4", "cat-cb5", "cat-cb6"].forEach(function(cat) {
                gebid(cat).disabled = true;
            });
        }
        else
        {
            var isChecked = false;
            ["cat-cb1", "cat-cb2", "cat-cb3", "cat-cb4", "cat-cb5", "cat-cb6"].forEach(function(cat) {
                var cel = gebid(cat);
                cel.disabled = false;

                if(cel.checked)
                    isChecked = true;
            });

            if(isChecked)
                isValid = true;
        }
    });

    if(!isValid)
    {
        allOk = false;
        gebid("categoryWrapper").style.borderColor = "red";
    }
    else
    {
        gebid("categoryWrapper").style.borderColor = "initial";
    }


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
    if(langChanged === true)
    {
        console.warn("langchanged")

        var langCode = gebid("lcodeSelect").value;

        if(idRanges[langCode])
        {
            var maxRange = parseInt(idRanges[langCode][1]);

            gebid("idRangeInputTo").max = maxRange;
            gebid("idRangeInputTo").value = maxRange;

            maxJokeIdRange = maxRange;
        }
        else
        {
            gebid("idRangeInputTo").max = parseInt("<!--%#INSERT:TOTALJOKESZEROINDEXED#%-->");

            maxJokeIdRange = parseInt("<!--%#INSERT:TOTALJOKESZEROINDEXED#%-->");
        }
    }

    var numRegex = /^[0-9]+$/gm;
    var fromVal = gebid("idRangeInputFrom").value;
    var toVal = gebid("idRangeInputTo").value;
    var fromValInt = parseInt(fromVal);
    var toValInt = parseInt(toVal);
    var outOfRange = (fromValInt < 0 || toValInt > maxJokeIdRange);
    var notNumber = ((fromVal.match(numRegex) == null) || (toVal.match(numRegex) == null));

    if(outOfRange || notNumber || fromValInt > toValInt)
    {
        allOk = false;
        gebid("idRangeWrapper").style.borderColor = "red";
    }
    else
    {
        gebid("idRangeWrapper").style.borderColor = "initial";
    }

    var jokesAmount = parseInt(gebid("jokesAmountInput").value);

    if(jokesAmount > parseInt("<!--%#INSERT:MAXJOKEAMOUNT#%-->") || jokesAmount < 1 || isNaN(jokesAmount))
    {
        allOk = false;
        gebid("jokeAmountWrapper").style.borderColor = "red";
    }
    else
    {
        gebid("jokeAmountWrapper").style.borderColor = "initial";
    }

    if(allOk)
    {
        tryItOk = true;
    }
    else
    {
        tryItOk = false;
    }

    buildURL();
}

//#MARKER build URL
function buildURL()
{
    var queryParams = [];

    //#SECTION categories
    var selectedCategories = [settings.anyCategoryName];
    if(gebid("cat-radio2").checked)
    {
        selectedCategories = [];
        if(gebid("cat-cb1").checked)
        {
            selectedCategories.push("Programming");
        }
        if(gebid("cat-cb2").checked)
        {
            selectedCategories.push("Miscellaneous");
        }
        if(gebid("cat-cb3").checked)
        {
            selectedCategories.push("Dark");
        }
        if(gebid("cat-cb4").checked)
        {
            selectedCategories.push("Pun");
        }
        if(gebid("cat-cb5").checked)
        {
            selectedCategories.push("Spooky");
        }
        if(gebid("cat-cb6").checked)
        {
            selectedCategories.push("Christmas");
        }

        if(selectedCategories.length == 0)
        {
            selectedCategories.push(settings.anyCategoryName);
        }
    }


    //#SECTION language
    var langCode = gebid("lcodeSelect").value || settings.defaultLang;
    if(langCode != settings.defaultLang)
        queryParams.push("lang=" + langCode);


    //#SECTION flags
    var flagElems = [gebid("blf-cb1"), gebid("blf-cb2"), gebid("blf-cb3"), gebid("blf-cb4"), gebid("blf-cb5"), gebid("blf-cb6")];
    var flagNames = JSON.parse('<!--%#INSERT:FLAGSARRAY#%-->');
    var selectedFlags = [];
    flagElems.forEach(function(el, i) {
        if(el.checked)
        {
            selectedFlags.push(flagNames[i]);
        }
    });

    if(selectedFlags.length > 0)
    {
        queryParams.push("blacklistFlags=" + selectedFlags.join(","));
    }


    //#SECTION format
    var formatElems = [gebid("fmt-cb1"), gebid("fmt-cb2"), gebid("fmt-cb3"), gebid("fmt-cb4")];
    formatElems.forEach(function(el) {
        if(el.checked && el.value != settings.defaultFormat)
        {
            queryParams.push("format=" + el.value);
        }
    });


    //#SECTION type
    var singleJoke = gebid("typ-cb1").checked;
    var twopartJoke = gebid("typ-cb2").checked;
    if(singleJoke ^ twopartJoke == 1)
    {
        if(singleJoke)
        {
            queryParams.push("type=single");
        }
        else if(twopartJoke)
        {
            queryParams.push("type=twopart");
        }
    }


    //#SECTION search string
    var sstr = gebid("searchStringInput").value;
    if(sstr)
    {
        queryParams.push("contains=" + encodeURIComponent(sstr));
    }


    //#SECTION id range
    var range = [parseInt(gebid("idRangeInputFrom").value), parseInt(gebid("idRangeInputTo").value)];
    if(!isNaN(range[0]) && !isNaN(range[1]) && range[0] >= 0 && range[1] <= maxJokeIdRange && range[1] >= range[0])
    {
        if(range[0] == range[1] && range[0] >= 0 && range[0] <= maxJokeIdRange)
        {
            // Use "x" format
            queryParams.push("idRange=" + range[0]);
        }
        else if(range[0] != 0 || range[1] != maxJokeIdRange)
        {
            // Use "x-y" format
            queryParams.push("idRange=" + range[0] + "-" + range[1]);
        }
    }


    //#SECTION amount
    var jokeAmount = parseInt(gebid("jokesAmountInput").value);
    if(jokeAmount != 1 && !isNaN(jokeAmount) && jokeAmount > 0 && jokeAmount <= parseInt("<!--%#INSERT:MAXJOKEAMOUNT#%-->"))
    {
        queryParams.push("amount=" + jokeAmount);
    }


    tryItURL = settings.baseURL + "/" + settings.jokeEndpoint + "/" + selectedCategories.join(",");

    if(queryParams.length > 0)
    {
        tryItURL += "?" + queryParams.join("&");
    }

    gebid("urlBuilderUrl").innerText = tryItURL;
}

//#MARKER send request
function sendTryItRequest()
{
    var sendStartTimestamp = new Date().getTime();
    var prpr = gebid("urlBuilderPrettyprint");
    var tryItRequestError = function(err) {
        if(prpr.classList.contains("prettyprint"))
        {
            prpr.classList.remove("prettyprint");
        }

        if(prpr.classList.contains("prettyprinted"))
        {
            prpr.classList.remove("prettyprinted");
        }

        gebid("tryItResult").innerHTML = "Error:<br><br>" + err;
    }

    if(!tryItOk)
    {
        return tryItRequestError("One or more of the parameters you specified are invalid.\nThey are outlined with a red border.\n\nPlease correct the parameters and try again.");
    }

    if(!prpr.classList.contains("prettyprint"))
    {
        prpr.classList.add("prettyprint");
    }

    if(prpr.classList.contains("prettyprinted"))
    {
        prpr.classList.remove("prettyprinted");
    }

    if(prpr.classList.contains("lang-json"))
    {
        prpr.classList.remove("lang-json");
    }

    if(prpr.classList.contains("lang-yaml"))
    {
        prpr.classList.remove("lang-yaml");
    }

    if(prpr.classList.contains("lang-xml"))
    {
        prpr.classList.remove("lang-xml");
    }

    prpr.classList.add("lang-json");

    try
    {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", tryItURL);
        xhr.onreadystatechange = function() {
            if(xhr.readyState == 4 && (xhr.status < 300 || xhr.status == 429))
            {
                var result = "";
                if(xhr.getResponseHeader("content-type").includes("json"))
                {
                    result = JSON.stringify(JSON.parse(xhr.responseText.toString()), null, 4);
                }
                else
                {
                    if(xhr.getResponseHeader("content-type").includes("xml"))
                    {
                        gebid("urlBuilderPrettyprint").classList.remove("lang-json");
                        gebid("urlBuilderPrettyprint").classList.add("lang-xml");
                    }
                    else
                    {
                        gebid("urlBuilderPrettyprint").classList.remove("lang-json");
                        gebid("urlBuilderPrettyprint").classList.add("lang-yaml");
                    }

                    result = xhr.responseText.toString();
                    result = result.replace(/[<]/gm, "&lt;");
                    result = result.replace(/[>]/gm, "&gt;");
                }

                gebid("tryItResult").innerText = result;
                gebid("tryItFormLatency").innerText = "Latency: " + (new Date().getTime() - sendStartTimestamp) + " ms";

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
function resetTryItForm(confirmation)
{
    if(confirmation === true && !confirm("Do you really want to reset the form?"))
        return;

    ["cat-cb1", "cat-cb2", "cat-cb3", "cat-cb4", "cat-cb5", "cat-cb6"].forEach(function(cat) {
        gebid(cat).checked = false;
    });

    gebid("cat-radio1").checked = true;

    ["blf-cb1", "blf-cb2", "blf-cb3", "blf-cb4", "blf-cb5", "blf-cb6"].forEach(function(flg) {
        gebid(flg).checked = false;
    });

    gebid("fmt-cb1").checked = true;

    ["typ-cb1", "typ-cb2"].forEach(function(type) {
        gebid(type).checked = true;
    });

    gebid("searchStringInput").value = "";

    gebid("idRangeInputFrom").value = 0;
    gebid("idRangeInputTo").value = parseInt("<!--%#INSERT:TOTALJOKESZEROINDEXED#%-->");

    gebid("jokesAmountInput").value = 1;

    reRender();
}

//#MARKER submit joke
function submitJoke()
{
    var submitBtn = gebid("submitBtn");
    if(submitBtn.disabled == true)
    {
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", settings.submitUrl);

    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4)
        {
            var res;
            try
            {
                res = JSON.parse(xhr.responseText);
            }
            catch(err)
            {
                alert("Error " + res.status + " while sending your submission:\n" + res.message + (res.additionalInfo ? "\n\nAdditional info:\n" + res.additionalInfo : ""));
                return;
            }

            if(xhr.status < 300)
            {
                if(res.error == false)
                {
                    submitBtn.disabled = true;

                    alert(res.message);
                    
                    setTimeout(function() {
                        gebid("submitBtn").disabled = false;
                    }, 2000);
                }
                else if(res.error == true)
                {
                    alert("Error " + res.status + " while sending your submission:\n" + res.message + (res.additionalInfo ? "\n\nAdditional info:\n" + res.additionalInfo : ""));
                }
            }
            else if(xhr.status >= 300)
            {
                var addInfo = res.message;
                if(res.additionalInfo)
                {
                    addInfo = res.additionalInfo;
                }
                alert("Error while sending your submission:\n" + addInfo);
            }
        }
    };

    xhr.send(JSON.stringify(submission, null, 4));
}

function valChanged(element)
{
    if(element.id == "f_type")
    {
        if(element.value == "single")
        {
            gebid("f_setup").placeholder = "Joke";

            gebid("f_delivery").style.display = "none";
        }
        else if(element.value == "twopart")
        {
            gebid("f_setup").placeholder = "Setup";

            gebid("f_delivery").style.display = "initial";
        }
    }

    if(element.id == "f_language")
    {
        if(element.value == "other")
        {
            gebid("f_langHideContainer").classList.remove("hidden");
        }
        else
        {
            gebid("f_langHideContainer").classList.add("hidden");
        }
    }

    buildSubmission();
}

function buildSubmission()
{
    var category = gebid("f_category").value;
    var type = gebid("f_type").value;

    submission = {
        formatVersion: settings.formatVersion,
        category: category,
        type: type
    }

    if(type == "single")
    {
        submission.joke = gebid("f_setup").value;
    }
    else if(type == "twopart")
    {
        submission.setup = gebid("f_setup").value;
        submission.delivery = gebid("f_delivery").value;
    }

    var sLang = gebid("f_language").value || settings.defaultLang;

    if(sLang == "other")
    {
        var elVal = gebid("f_customLang").value;
        if(elVal && elVal.length == 2)
        {
            sLang = elVal;
        }
        else
        {
            sLang = "Please enter 2 char language code";
        }
    }

    submission = {
        ...submission,
        flags: {
            nsfw: gebid("f_flags_nsfw").checked,
            religious: gebid("f_flags_religious").checked,
            political: gebid("f_flags_political").checked,
            racist: gebid("f_flags_racist").checked,
            sexist: gebid("f_flags_sexist").checked,
            explicit: gebid("f_flags_explicit").checked
        },
        lang: sLang
    };

    var subDisp = gebid("submissionDisplay");

    var escapedSubmission = JSON.parse(JSON.stringify(submission)); // copy value without reference
    if(type == "single")
    {
        escapedSubmission.joke = htmlEscape(submission.joke);
    }
    else if(type == "twopart")
    {
        escapedSubmission.setup = htmlEscape(submission.setup);
        escapedSubmission.delivery = htmlEscape(submission.delivery);
    }
    subDisp.innerText = JSON.stringify(escapedSubmission, null, 4);

    var subCodeElem = gebid("submissionCodeElement");

    if(!subCodeElem.classList.contains("prettyprint"))
    {
        subCodeElem.classList.add("prettyprint");
    }

    if(subCodeElem.classList.contains("prettyprinted"))
    {
        subCodeElem.classList.remove("prettyprinted");
    }

    if(subCodeElem.classList.contains("lang-json"))
    {
        subCodeElem.classList.remove("lang-json");
    }

    subCodeElem.classList.add("lang-json");

    setTimeout(function() {
        PR.prettyPrint(); // eslint-disable-line no-undef
    }, 5);
}

/**
 * Escapes unsafe HTML
 * @param {String} unsafeHTML
 * @returns {String}
 */
function htmlEscape(unsafeHTML)
{
    unsafeHTML = unsafeHTML.replace(/</g, "&lt;");
    unsafeHTML = unsafeHTML.replace(/>/g, "&gt;");

    return unsafeHTML;
}

//#MARKER privacy policy
function privPolMoreInfo()
{
    sMenu.open("privacyPolicy");
}

function hideUsageTerms()
{
    gebid("usageTerms").style.display = "none";
    Cookies.set("hideUsageTerms", "true", {"expires": 365}); // eslint-disable-line no-undef
}


//#MARKER misc
function openRestartForm()
{
    sMenu.open("restartPrompt");
}

function submitRestartForm()
{
    restart(gebid("restartFormToken").value || null);
    sMenu.close("restartPrompt");
}

function restart(token)
{
    if(!token)
    {
        token = prompt("Enter restart token:");
    }

    if(!token)
    {
        return;
    }

    var restartXhr = new XMLHttpRequest();
    restartXhr.open("PUT", settings.baseURL + "/restart");
    restartXhr.onreadystatechange = function() {
        if(restartXhr.readyState == 4)
        {
            if(restartXhr.status == 400)
            {
                console.warn("Error 400 - The entered token is invalid");
                alert("Error 400 - The entered token is invalid");
            }
            else if(restartXhr.status >= 300)
            {
                console.warn("Error " + restartXhr.status + " - " + restartXhr.responseText);
                alert("Error " + restartXhr.status + " - " + restartXhr.responseText);
            }
            else if(restartXhr.status < 300)
            {
                var xhrData = JSON.parse(restartXhr.responseText);
                console.info(xhrData.message + "\nInternal Time of Restart: " + toFormattedDate(xhrData.timestamp));
                alert(xhrData.message + "\nInternal Time of Restart: " + toFormattedDate(xhrData.timestamp));
            }
        }
    };
    restartXhr.send(token.toString());
}

function toFormattedDate(unixTimestamp)
{
    var d = new Date(unixTimestamp);
    return d.toLocaleString("de-DE");
}

/**
 * Parses the contributor object and puts the contents into the element #contributorsContainer
 */
function loadContributors()
{
    var container = gebid("contributorsContainer");

    container.innerHTML = "";

    settings.contributorsObject.forEach(function(contributor) {
        var contrElem = document.createElement("div");
        contrElem.classList.add("contributor");

        var name = document.createElement("div");
        name.classList.add("contributorName");
        name.innerText = contributor.name;
        contrElem.appendChild(name);

        if(typeof contributor.email == "string")
        {
            var email = document.createElement("a");
            email.href = "mailto:" + contributor.email + "?subject=JokeAPI%20Contribution";
            email.innerText = contributor.email;
            email.classList.add("contributorEmail");
            email.classList.add("contributorContact");
            contrElem.appendChild(email);
        }

        if(typeof contributor.url == "string")
        {
            var url = document.createElement("a");
            url.href = contributor.url;
            url.innerText = contributor.url;
            url.classList.add("contributorURL");
            url.classList.add("contributorContact");
            contrElem.appendChild(url);
        }

        if(Array.isArray(contributor.contributions))
        {
            var contributionList = document.createElement("ul");
            contributionList.classList.add("contributorContributionsList");
            contributor.contributions.forEach(function(contribution) {
                var contributionEl = document.createElement("li");
                contributionEl.innerText = contribution;
                contributionList.appendChild(contributionEl);
            });
            contrElem.appendChild(contributionList);
        }

        container.appendChild(contrElem);
    });

    /*
    [
        {
            "name": "XY",
            "email": "xy@example.org", (OPTIONAL)
            "url": "https://example.org", (OPTIONAL)
            "contributions": [
                "Implemented a whole lot of stuff",
                "Stuff",
                "Even more stuff",
                ...
            ]
        },
        ...
    ]
    */
}

/**
 * Loads all category aliases, adding them to the element #catAliasesContainer
 */
function loadCategoryAliases()
{
    var container = gebid("catAliasesContainer");
    var amt = 0;

    Object.keys(settings.categoryAliasesObject).forEach(function(key) {
        var value = settings.categoryAliasesObject[key];

        var trElem = document.createElement("tr");


        var keyElem = document.createElement("td");
        keyElem.innerText = key;

        var valElem = document.createElement("td");
        valElem.innerText = value;

        trElem.appendChild(keyElem);
        trElem.appendChild(valElem);


        container.appendChild(trElem);
        amt++;
    });

    console.info("Found " + amt + " category aliases");
}



//#MARKER cleanup
function unused(...args)
{
    args.forEach(function(arg) {
        try{arg.toString();}
        catch(err) {return;}
        return;
    });
}

unused(openNav, closeNav, onLoad, reRender, privPolMoreInfo, hideUsageTerms, sendTryItRequest, submitRestartForm);
