            var baseURL = "";
            if(isLocal) baseURL = "http://127.0.0.1:8079/jokeapi";
            else baseURL = "https://sv443.net/jokeapi";
            
            // const checkScroll = () => {
            //     let sct = gebid("sctopbtn");
            //     if(window.scrollY > 500) sct.style.display = "inline-block";
            //     else sct.style.display = "none";
            // }
            
            // document.onscroll = checkScroll;
            // document.onresize = checkScroll;
            // checkScroll();
            
            let xh = new XMLHttpRequest();
            xh.open("GET", `${baseURL}/categories`);
            xh.onreadystatechange = () => {
                if(xh.readyState == 4 && xh.status == 200) {
                    gebid("categoryDisp").innerHTML=syntaxHighlight(xh.responseText);
                    gebid("categoryDisp").childNodes.forEach(cn => {
                        if(cn.className == "key") cn.innerHTML="<br>&nbsp;&nbsp;&nbsp;&nbsp;" + cn.innerHTML;
                    });
                    gebid("categoryDisp").innerHTML=gebid("categoryDisp").innerHTML.replace("}", "<br>}");
                }
            }
            xh.send();

            let xh2 = new XMLHttpRequest();
            xh2.open("GET", `${baseURL}/info`);
            xh2.onreadystatechange = () => {
                if(xh2.readyState == 4 && xh2.status == 200) {
                    let vins = gebcn("insertversion");
                    for(let i = 0; i < vins.length; i++) {
                        vins[i].innerHTML = `v${JSON.parse(xh2.responseText).version}`;
                    }

                    gebid("informationDisp").innerHTML=syntaxHighlight(xh2.responseText);
                    gebid("informationDisp").childNodes.forEach(cn => {
                        if(cn.innerHTML != undefined) {
                            twoTabKeys = ["totalCount", "categories", "flags", "submissionURL"];
                            if(!twoTabKeys.includes(cn.innerHTML) && cn.className == "key") cn.innerHTML="<br>&nbsp;&nbsp;&nbsp;&nbsp;" + cn.innerHTML;
                            else if(cn.className == "key") cn.innerHTML="<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + cn.innerHTML;
                        }
                    });
                    gebid("informationDisp").innerHTML=gebid("informationDisp").innerHTML.replace(/\}/gm, "<br>}");
                }
            }
            xh2.send();

            setInterval(()=>{
                // window.location.reload();
            }, 3000);

            function openSubmissionForm() {
                Menu.open("submitjoke");
            }

            function sendReq(category, flags) {
                let xhr = new XMLHttpRequest();
                xhr.open("GET", `${baseURL}/category/${category.toString()}?blacklistFlags=${flags.join(",")}`);
                xhr.onreadystatechange = () => {
                    if(xhr.readyState == 4) {
                        if(xhr.status < 400) {
                            gebid("testresult").innerHTML=syntaxHighlight(xhr.responseText);
                            gebid("testresult").childNodes.forEach(cn => {
                                if(cn.className == "key") cn.innerHTML="<br>&nbsp;&nbsp;&nbsp;&nbsp;" + cn.innerHTML;
                            });
                            gebid("testresult").innerHTML=gebid("testresult").innerHTML.replace("}", "<br>}");
                        }
                        else {
                            gebid("testresult").innerHTML=`Error: ${xhr.status} - ${xhr.statusText}: ${xhr.responseText}`;
                        }
                    }
                }
                xhr.send();
            }

            function syntaxHighlight(json) {
                if (typeof json != 'string') {
                    json = JSON.stringify(json, undefined, 4);
                }
                json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                    var cls = 'number';
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'key';
                        } else {
                            cls = 'string';
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'boolean';
                    } else if (/null/.test(match)) {
                        cls = 'null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                });
            }

            const sURL = "https://sv443.net/r/submitJoke";
            const sIHTML = `<iframe id="submitjokeformframe" src="${sURL}"></iframe>`;

            const Menu=new function(){this.new=function(id,title,innerhtml,width,height,border_rounded,closable_ESC,closable_btn,on_close,close_img_src){if(typeof id=="string"&&typeof title=="string"&&typeof innerhtml=="string"&&typeof width=="number"&&typeof height=="number"){if(gebid("jsg_menu_"+id)!=null){console.error("a menu with the ID "+id+" already exists - not creating a new one");return}
            if(isempty(border_rounded))border_rounded=!0;if(typeof closable_ESC!="boolean")closable_ESC=!0;if(typeof closable_btn!="boolean")closable_btn=!0;if(isempty(on_close))on_close=function(){};if(isempty(close_img_src))close_img_src="https://sv443.net/resources/images/jsg_menu_close.png";var menuelem=document.createElement("div");menuelem.style.display="none";menuelem.style.opacity="0";menuelem.style.transition="opacity 0.3s ease-in";menuelem.id="jsg_menu_"+id;menuelem.style.position="fixed";menuelem.style.top=((100-height)/2)+"vh";menuelem.style.left=((100-width)/2)+"vw";menuelem.style.width=width+"vw";menuelem.style.height=height+"vh";menuelem.style.padding="0.2em";menuelem.style.border="0.25em solid #454545";if(border_rounded)menuelem.style.borderRadius="1.2em";else menuelem.style.borderRadius="0";if(closable_btn)closebtnih='<img onclick="Menu.close(\''+id+'\')" class="jsg_menuclosebtn" title="Close" src="https://raw.githubusercontent.com/Sv443/JSGame/master/closebtn.png" style="cursor:pointer;position:absolute;top:0;right:0;width:1.5em;height:1.5em;">';else closebtnih="";menuelem.style.backgroundColor="#ddd";menuelem.innerHTML="<div class='jsg_menutitle' style='font-size:1.5em;text-align:center;'>"+title+"</div>"+closebtnih+"<br>"+innerhtml;document.body.appendChild(menuelem);if(closable_ESC)document.addEventListener("keydown",e=>{if(e.keyCode==27)Menu.close(id)})}
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

            function gebid(id){return document.getElementById(id);}function gebcn(classname){return document.getElementsByClassName(classname);}function gebtn(tagname){return document.getElementsByTagName(tagname);}function isempty(string){if(string === undefined || string === null || string == "") return true;else return false;}

            Menu.new("submitjoke", "Submit a Joke", sIHTML, 85, 85, true, true, true);