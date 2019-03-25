const jsl = require("svjsl");
const fs = require("fs");

const settings = require("./settings.js");


module.exports = (ipaddr, method) => {
    let writeData = `[${new Date().toUTCString()}] - ${ipaddr} sent ${method}`;
    fs.appendFileSync(settings.logPath, writeData + "\n");

    let i, count = 0;
    fs.createReadStream(settings.logPath).on('data', function(chunk) {
        for (i=0; i < chunk.length; ++i) if(chunk[i] == 10) count++;
    }).on('end', () => {
        if(count > settings.logMaxLines) fs.writeFileSync(settings.logPath, `cleared on ${new Date().toUTCString()}\n\n`);
    });
}