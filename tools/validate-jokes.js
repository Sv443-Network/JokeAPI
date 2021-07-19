const { colors } = require("svcorelib");
const settings = require("../settings");
const promiseSeq = require("promise-all-sequential")



console.log(`\nValidating jokes-xy.json files in "${settings.jokes.jokesFolderPath}"...\n`);

const initStages = [
    require("../src/languages").init,
    require("../src/translate").init
];

promiseSeq(initStages).then(async () => {
    try
    {
        await require("../src/parseJokes").init();
        console.log(`${colors.fg.green}All jokes are valid.${colors.rst}\n`);
        process.exit(0);
    }
    catch(err)
    {
        console.log(`${colors.fg.red}Error while validating jokes:${colors.rst}\n${err}\n`);
        process.exit(1);
    }
}).catch(err => {
    console.log(`${colors.fg.red}Error while initializing:\n${colors.rst}${err}\n`);
    process.exit(1);
});
