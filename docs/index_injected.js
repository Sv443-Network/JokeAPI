document.addEventListener("DOMContentLoaded", () => {
    console.log("JokeAPI Documentation (v2.0.0)");

    try
    {
        // only works in modern browsers
        document.getElementById("content").onclick = closeNav;
        document.getElementsByTagName("header")[0].onclick = closeNav;
    }
    catch(err) {unused();}
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

    document.getElementById("sidenav").style.width = "280px";
    document.getElementById("content").style.marginLeft= "280px";
    document.getElementsByTagName("header")[0].dataset["grayscaled"] = "true";
    document.getElementById("sideNavOpen").style.visibility = "hidden";
}
  
function closeNav()
{
    if(document.body.dataset["sidenav"] != "opened")
        return;

    document.body.dataset["sidenav"] = "closed";

    document.getElementById("sidenav").style.width = "0";
    document.getElementById("content").style.marginLeft= "0px";
    document.getElementsByTagName("header")[0].dataset["grayscaled"] = "false";
    document.getElementById("sideNavOpen").style.visibility = "visible";
}






//#MARKER cleanup
unused([openNav, closeNav]);