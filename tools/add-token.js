const jsl = require("svjsl");
const fs = require("fs");
const settings = require("../settings");

try
{
    let amount;

    try
    {
        amount = parseInt(process.argv[2].replace(/[-]/g, ""));
    }
    catch(err)
    {
        jsl.unused(err);
        amount = 1;
    }

    console.log("\n");

    for(let i = 0; i < amount; i++)
    {
        let tok = jsl.generateUUID.custom("xxxxyyyy_xxxxyyyyxxxxyyyy_xxxxyyyyxxxxyyyy", "0123456789abcdefghijklmnopqrstuvwxyz!?$§%");

        let oldFile = [];
        if(fs.existsSync(settings.auth.tokenListFile))
        {
            let fCont = fs.readFileSync(settings.auth.tokenListFile).toString();
            if(!jsl.isEmpty(fCont))
                oldFile = JSON.parse(fCont);
            else
                oldFile = [];
        }

        oldFile.push({
            token: tok,
            maxReqs: null // null = default
        });

        fs.writeFileSync(settings.auth.tokenListFile, JSON.stringify(oldFile, null, 4));

        console.log(`Token ${jsl.colors.fg.green}${tok}${jsl.colors.rst} added to the list of tokens at "${settings.auth.tokenListFile}".`);
    }

    console.log("\n\n");
    return process.exit(0);
}
catch(err)
{
    return process.exit(1);
}