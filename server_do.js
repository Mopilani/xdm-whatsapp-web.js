const fs = require('fs');

const serverDoFilename = 'do.json';

var doContent = {};

/** Do Content Arch:
 * { gid : {
 *          name : string,
 *          todoList : {
 *              content : Content,
 *              time: time, 
 *          }
 *      }
 * }
 *  */

export function addToDo(gid, content, time) {
    doContent[gid] = {
        content: content,
        time: time,
    };
}

export function loadServerDo() {
    fs.readFile(serverDoFilename, (err, data) => {
        if (err != null) {
            return console.error(err);
        }
        doContent = JSON.parse(data);

        console.log(`Server Do: ${doContent}`);
        console.log('---------------------');
    });
}

function writeServerDo() {
    fs.writeFile(serverDoFilename, JSON.stringify(doContent), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}
