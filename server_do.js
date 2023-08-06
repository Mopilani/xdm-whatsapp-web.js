const fs = require('fs');

const serverDoFilename = 'do.json';

function loadServerDo() {
    fs.readFile(serverDoFilename, (err, data) => {
        if (err != null) {
            return console.error(err);
        }
        var doContent = JSON.parse(data);

        console.log(`Server Do: ${doContent}`);
        console.log('---------------------');

        logMsgs = config['logMsgs'] ?? false;
        chatNumber = config['chatnum'];
    });
}

function writeServerDo(doContent) {
    fs.writeFile(serverDoFilename, JSON.stringify(doContent), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}