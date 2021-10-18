const jsl = require("svjsl");
const fs = require("fs-extra");
const settings = require("../settings");

try
{
    let amount;

    console.log(process.argv);

    try
    {
        amount = parseInt(
            process.argv.find(arg => arg.match(/^-{0,2}\d+$/))
            .replace(/[-]/g, "")
        );
    }
    catch(err)
    {
        jsl.unused(err);
        amount = NaN;
    }

    if(isNaN(amount) || amount < 1)
        amount = 1;
    
    amount = Math.min(amount, 10);

    console.log("\n");

    for(let i = 0; i < amount; i++)
    {
        let tok = jsl.generateUUID.custom("xxxxyyyyxxxxyyyy_xxxxyyyyxxxxyyyy_xxxxyyyyxxxxyyyy_xxxxyyyyxxxxyyyy", "0123456789abcdefghijklmnopqrstuvwxyz!?$§%*.~");

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

    console.log("\n");
    return process.exit(0);
}
catch(err)
{
    return process.exit(1);
}
