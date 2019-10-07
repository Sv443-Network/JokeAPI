const jsl = require("svjsl");
const settings = require("../settings");

console.log(`\nValidating jokes in "${settings.jokes.jokesFilePath}"...\n`);

require("../src/parseJokes").init().then(() => {
    console.log(`\n${jsl.colors.fg.green}All jokes are valid.${jsl.colors.rst}\n`);
    process.exit(0);
}).catch(err => {
    console.log(`\n${jsl.colors.fg.red}${err}${jsl.colors.rst}\n`);
    process.exit(1);
});