const { Errors, colors } = require("svcorelib");

const settings = require("../settings");

const col = colors.fg;
const { exit } = process;


async function run()
{
    try
    {
        const lines = [
            `${settings.info.name} v${settings.info.version} - Info`,
            ``,
            `TODO:`,
        ];

        process.stdout.write(`${lines.join("\n")}\n`);

        exit(0);
    }
    catch(err)
    {
        console.log(`\n${col.red}Error while displaying info:${col.rst}\n${err}\n`);
        exit(1);
    }
}


//#SECTION on execute

try
{
    if(!process.stdin.isTTY)
        throw new Errors.NoStdinError("The process doesn't have an stdin channel to read input from");
    else
        run();
}
catch(err)
{
    console.error(`${col.red}${err.message}${col.rst}\n${err.stack}\n`);

    exit(0);
}
