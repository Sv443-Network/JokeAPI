document.addEventListener("DOMContentLoaded", () => {
    console.log("JokeAPI Documentation (v2.0.0)");

    window.jokeapi = {};

    document.getElementById("content").onclick = closeNav;
    document.getElementsByTagName("header")[0].onclick = closeNav;

    try
    {
        // only works in modern browsers
    }
    catch(err) {unused();}

    document.addEventListener("keyup", e => {
        console.log(`Key: "${e.key}" - ${window.jokeapi.sidenavOpened}`);
        if(e.key == "m")
        {
            if(window.jokeapi.sidenavOpened)
                closeNav();
            else openNav();
        }
        else if(e.key == "Escape" && window.jokeapi.sidenavOpened)
            closeNav();
    });
});

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






//#MARKER cleanup
unused([openNav, closeNav]);