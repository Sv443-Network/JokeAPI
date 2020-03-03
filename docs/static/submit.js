// var submitUrl = "https://sv443.net/jokeapi/v2/submit";
var submitUrl = "http://127.0.0.1:8076/submit"

document.addEventListener("DOMContentLoaded", function() {
    var inputElems = [
        "f_category",
        "f_type",
        "f_flags_nsfw",
        "f_flags_religious",
        "f_flags_political",
        "f_flags_racist",
        "f_flags_sexist",
        "f_setup",
        "f_delivery"
    ];

    for(var i = 0; i < inputElems.length; i++)
    {
        document.getElementById(inputElems[i]).onchange = function() {
            return valChanged(this);
        }
    }

    document.getElementById("submit").addEventListener("click", function() {
        submit();
    });
});

function valChanged(element)
{
    if(element.id == "f_type")
    {
        if(element.value == "single")
        {
            document.getElementById("f_setup").placeholder = "Joke";

            document.getElementById("f_delivery").style.display = "none";
        }
        else if(element.value == "twopart")
        {
            document.getElementById("f_setup").placeholder = "Setup";

            document.getElementById("f_delivery").style.display = "initial";
        }
    }
}

function submit()
{
    var category = document.getElementById("f_category").value;
    var type = document.getElementById("f_type").value;

    var submission = {
        formatVersion: 2,
        category: category,
        type: type,
        flags: {
            nsfw: document.getElementById("f_flags_nsfw").checked,
            religious: document.getElementById("f_flags_religious").checked,
            political: document.getElementById("f_flags_political").checked,
            racist: document.getElementById("f_flags_racist").checked,
            sexist: document.getElementById("f_flags_sexist").checked,
        }
    }

    if(type == "single")
    {
        submission.joke = document.getElementById("f_setup").value;
    }
    else if(type == "twopart")
    {
        submission.setup = document.getElementById("f_setup").value;
        submission.delivery = document.getElementById("f_delivery").value;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", submitUrl);

    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4)
        {
            var res = JSON.parse(xhr.responseText);

            if(xhr.status < 300)
            {
                if(res.error == false)
                {
                    alert(res.message);
                }
                else if(res.error == true)
                {
                    alert("Error while sending your submission:\n" + res.message);
                }
            }
            else if(xhr.status >= 300)
            {
                alert("Error while sending your submission:\n" + res.message);
            }
        }
    };

    xhr.send(JSON.stringify(submission));
}