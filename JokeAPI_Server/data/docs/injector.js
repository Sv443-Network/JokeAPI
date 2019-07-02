const settings = require("../../settings");
const fs = require("fs");



module.exports = () => {
    try {
        let result = fs.readFileSync(`${settings.docsFolder}/${settings.docsFiles.HTML}`).toString();

        result = result.replace("<!--%%INJECT:STYLE%%-->", `\t<!--INJECTED::--><style>\n${fs.readFileSync(`${settings.docsFolder}/${settings.docsFiles.CSS}`).toString()}\n\t</style><!--:/:INJECTED-->`);
        result = result.replace("<!--%%INJECT:SCRIPT%%-->", `\t\t<!--INJECTED::--><script>\n${fs.readFileSync(`${settings.docsFolder}/${settings.docsFiles.JS}`).toString()}\n\t\t</script><!--:/:INJECTED-->`);

        result = result.toString();

        fs.writeFileSync(`${settings.docsFolder}/lastComplete.html`, result);

        return true;
    }
    catch(err) {
        console.log(`\x1b[31m\x1b[1m\nCouldn't inject style and script into docs file: ${err}\n\n\x1b[0m`);
        process.exit(1);
    }
}