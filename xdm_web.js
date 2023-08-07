const { Client, Location, List, Buttons, LocalAuth } = require('./index');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { Writable } = require('stream');
const fs = require('fs');
// const xserv = require('./x_server');

// const server_do = require('./server_do');

// const http = require("http");
const express = require("express");
const app = express();
app.use(express.json()) 

const xport = 8156;

// This server must response for the dart xdm-bot-server
// 1- respond for sending groups contents periodicly

app.post("/post", function (req, res) {
    // res.sendFile(__dirname + "/index.html");
    var receiver = req.headers['receiver'];
    var content = req.body;
    console.log(`receiver: ${receiver}, content: ${content}`);
    client.sendMessage(receiver, content.content.toString());
    res.end();
});

function runServer() {
    app.listen(xport, function () {
        console.log(`Listening on port ${xport}!`);
    });
}

const client = new Client({
    authStrategy: new LocalAuth(),
    // proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: {
        // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
        args: ['--disable-gpu', '--no-sandbox'],
        // headless: false,
    }
});

client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('READY');
});

// server_do.loadServerDo();

let serverConfigFileName = 'xdm.json';
var config = {};

var msgUrlKey = 'h';
var msgHostKey = 'ho';
var msgPathKey = 'p';
var msgPortKey = 'po';
var msgHeadersKey = 'h';
var msgBodyKey = 'b';
var msgMethodKey = 'm';

var chatNumber;
var smsg;

var host = "0.0.0.0";
var port = 8082;
var reqCount = 0;

var waitRequest = false;
var waitResponse = false;
var logMsgs = false;

let queue = {
    // 123456 : [Frame, Frame, ...],
    // 123456-h : {}
};

function generateRandomBytes(length) {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(length, (err, buf) => {
            if (err) reject(err);
            resolve(Array.from(buf));
        });
    });
}

function decimalToHex(decimal) {
    return (decimal).toString(16).padStart(2, '0');
}

function bytesToHex(bytes) {
    let hexString = '';
    for (let i = 0; i < bytes.length; i++) {
        hexString += decimalToHex(bytes[i]);
    }
    return hexString;
}

fs.readFile(serverConfigFileName, (err, data) => {
    if (err != null) {
        return console.error(err);
    }
    config = JSON.parse(data);

    console.log(`Server Config: ${config}`);
    console.log('---------------------');

    logMsgs = config['logMsgs'] ?? false;
    chatNumber = config['chatnum'];

});

fs.readFile(serverConfigFileName, (err, data) => {
    if (err != null) {
        return console.error(err);
    }
    config = JSON.parse(data);

    console.log(`Server Config: ${config}`);
    console.log('---------------------');

    logMsgs = config['logMsgs'] ?? false;
    chatNumber = config['chatnum'];

});

var _window = 1;

var server = http.createServer(async function (req, res) {
    reqCount++;

    var headerHostSegs = req.headers.host.split(":");
    var host = headerHostSegs[0];
    var port = headerHostSegs[1];
    var method = req.method;
    var url = req.url;
    // var path = '';
    var body;
    if (method != "GET" && method != "CONNECT") {
        try {
            var contentType = req.headers['content-type'];

            if (contentType != null) {

                if (contentType.includes('json')) {
                    JSON.parse();
                } else if (contentType.includes('stream')) {

                }
            }
        } catch (e) {
            //
        }
    }
    console.log("--------------------------- > " + reqCount);
    console.log("Headers: " + req.rawHeaders);
    console.log("---------------------------");

    var path = '';
    let options = {};

    options[msgUrlKey] = path;
    options[msgHostKey] = host;
    options[msgPortKey] = port;
    // options[msgPathKey] = path;
    options[msgMethodKey] = method;
    options[msgHeadersKey] = {
        ...req.headers
    };
    options[msgBodyKey] = body;

    console.log('Options: ' + options.toString());
    console.log("---------------------------");

    if (chatNumber == null) {
        console.log('No number selected');
    }

    // Getting the chat
    let chat = await smsg.getChat();
    chat.sendSeen();

    // Initializing a window
    _window++;
    queue[_window + '-h'] = {};
    queue[_window] = [];

    // Make Message
    var message = `!req ${_window} ${JSON.stringify(options)}`;
    client.sendMessage(chatNumber, message);

    var readable = req;

    const writableStream = new Writable({
        // write(chunk, encoding, callback) { console.log(chunk.toString()); callback(); }
    });

    // 'readable' may be triggered multiple times as data is buffered in
    readable.on('readable', () => {
        let chunk;
        console.log('Stream is readable (new data received in buffer)');
        // Use a loop to make sure we read all currently available data
        while (null !== (chunk = readable.read())) {
            console.log(`Read ${chunk.length} bytes of data...`);
            writableStream.write(chunk);
        }
    });
    // queue[];

    var noResponse = true;
    var responseNotCompeleted = true;
    // var _msg;


    var resHeaders;
    var resStatusCode = 500;
    while (noResponse) {
        resHeaders = JSON.parse(queue[_window + '-h']);
        resStatusCode = resHeaders['sc'];
    }

    res.writeHead(resStatusCode, resHeaders);

    var lastIndex = 0;
    while (responseNotCompeleted) {
        // client.on('message_create', async (msg) => { _msg = msg; noResponse = false; });
        var dataFrame = queue[_window][lastIndex];
        if (dataFrame == null) {
        } else {
            writableStream.write(dataFrame);
            lastIndex++;
        }
        // var jsonMap = JSON.parse(requestStr); var destination = jsonMap['d']; var headers = jsonMap['h']; var method = jsonMap['m']; var body = jsonMap['b'];
    }

    writableStream.end();
    writableStream.pipe(res);
    // res.end(JSON.stringify('Sorry you miss your goal. This is a WAW proxy server'));
    return;

    // var headers = {
    //     // "Content-Range": `bytes ${start}-${end}/${videoSize}`, // "Accept-Ranges": "bytes", // "Content-Length": contentLength, // "Content-Type": "video/mp4",
    // }; res.writeHead(206, headers); res.end();
});

client.on('message', async msg => {

});

client.on('message_create', async (msg) => {
    try {
        if (logMsgs)
            console.log('MESSAGE RECEIVED', msg);

        if (waitRequest) {
            // options[msgHostKey] = host;
            // options[msgPortKey] = port;
            // var jsonMap = JSON.parse(msg.body); var destination = jsonMap[msgUrlKey]; var headers = jsonMap[msgHeadersKey]; var method = jsonMap[msgMethodKey]; var body = jsonMap[msgBodyKey];
            // if (destination == null || headers == null || method == null) {
            //     msg.reply('في حاجة غلط يا مان: Headers: ' + headers + 'Dest: ' + destination + 'Method: ' + method + 'msg.from: ' + msg.from);
            // } https.get(destination, res => {
            //     let data = []; console.log('Status Code: ', res.statusCode);
            //     // const headerDate = res.headers && res.headers.date;
            //     res.on('data', chunk => {  data.push(chunk);
            //     }); res.on('end', () => { console.log('Response ended.');
            //         // msg.reply(''); }); }).on('error', err => {  console.log('Error: ', err.message);}); waitRequest = false;
        } else if (msg.fromMe && msg.body === 'showconf') {
            msg.reply(config);
        } else if (msg.fromMe && msg.body.startsWith('setnum')) {
            chatNumber = msg.body.split(' ')[1];
            chatNumber = chatNumber.includes('@c.us') ? chatNumber : `${chatNumber}@c.us`;
            msg.reply(`Chat number setted to ${chatNumber}`);
            smsg = msg;

            config['chatnum'] = chatNumber;

            fs.writeFile(serverConfigFileName, JSON.stringify(config), (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
        } else if (msg.body.startsWith('!req ')) {
            var window = msg.body.split(' ')[1];
            var frame = 0;
            let requestStr = msg.body.slice(`!req ${window} `.length, msg.body.length);
            var jsonMap = JSON.parse(requestStr);
            var destination = jsonMap[msgUrlKey];
            var headers = jsonMap[msgHeadersKey];
            var method = jsonMap[msgMethodKey];
            var body = jsonMap[msgBodyKey];

            if (destination == null || headers == null || method == null) {
                msg.reply('في حاجة غلط يا مان: Headers: ' + headers + 'Dest: ' + destination + 'Method: ' + method + 'msg.from: ' + msg.from);
            }

            var options;
            if ((headers['Content-Type']).includes("stream")) {
                options = {
                    hostname: host,
                    port: port,
                    path: path,
                    method: method,
                    headers: {
                        ...headers,
                    },
                };
            } else {
                options = {
                    hostname: host,
                    port: port,
                    path: path,
                    method: method,
                    headers: {
                        ...headers,
                    },
                    body: body,
                };
            }

            const req = http.request(options, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                var headers = JSON.stringify(res.headers);
                console.log(`HEADERS: ${headers}`);
                // headers['sc'] = res.statusCode.toString();

                client.sendMessage(msg.from, `!resh ${res.statusCode} ${window} ${headers}`);
                // res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                    frame++;
                    client.sendMessage(msg.from, `!res ${window} ${frame} ${bytesToHex(bytes)}`);
                });
                res.on('end', () => {
                    console.log(`No more data in response. ${window}`);
                });
            });

            req.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
            });

            // Write data to request body
            if ((headers['Content-Type']).includes("stream")) {
                req.write(postData);
            }
            req.end();

            // var res = http.request(options); res.writeHead(res.statusCode, res.headers); res.end(res.body);
            // switch (req.method) {
            //     case "GET":
            //         var res = http.request(options);
            //         res.writeHead(res.statusCode, res.headers);
            //         res.end(res.body);
            //         msg.body.sendMessage(); return;
            //     case "POST":     break;
            //     case "DELETE":  break;
            //     case "PUT":   break;
            //     case "CONNECT":    break;
            //     default:
            //         console.log("Unknown Request Method");
            //         break;
            // }
            // Switch wait for request
            // waitRequest = true;
            // } else if (waitResponse) {
            // waitResponse = false;
            // } else if (msg.body.startsWith('!! ')) {
            //     var bardMsg = msg.body.slice('!! '.length);
            //     options = {
            //         href: 'http://localhost:8183/',
            //         origin: 'http://localhost:8183',
            //         protocol: 'http:',
            //         host: 'localhost:8183',
            //         hostname: 'localhost',
            //         port: '8183',
            //         path: '/',
            //     }
            //     options['method'] = 'POST';
            //     console.log(options);
            //     try {
            //         const req = http.request(options, (res) => {
            //             console.log('Code: ' + res.statusCode);
            //             if (res.statusCode == 500) {
            //                 msg.reply('ISE');
            //                 return;
            //             }
            //             res.setEncoding('utf8');
            //             var answer = '';
            //             res.on('data', (chunk) => {
            //                 // console.log(`BODY: ${chunk}`);
            //                 answer = answer + chunk;
            //             });
            //             res.on('end', () => {
            //                 console.log('Answer: ' + answer);
            //                 msg.react('❤️');
            //                 msg.reply(answer);
            //             });

            //         });
            //         req.on('error', (e) => {
            //             console.error(`problem with request: ${e.message}`);
            //             msg.reply(`Cannot Connect to the Proxy: ${e.message}`);
            //         });
            //         // 'What is the meaning of life?'
            //         req.write(bardMsg);
            //         req.end();
            //     } catch (e) {
            //         msg.reply(e);
            //     }
        } else if (msg.body === 'ransom') {
            const length = 65536;
            generateRandomBytes(length)
                .then(bytes => {
                    console.log('Random bytes:', bytes.buf);
                    // const hexString = bytesToHex(decimalBytes);
                    msg.reply(bytesToHex(bytes));
                    msg.reply(bytesToHex(bytes));
                    msg.reply(bytesToHex(bytes));
                    msg.reply(bytesToHex(bytes));

                    msg.reply(bytesToHex(bytes));
                    msg.reply(bytesToHex(bytes));
                    msg.reply(bytesToHex(bytes));
                    msg.reply(bytesToHex(bytes));
                })
                .catch(error => {
                    console.error('Error generating random bytes:', error);
                });
        } else if (msg.body.startsWith('!resh ')) {
            var msgSegs = msg.body.split(' ');
            statusCode = msgSegs[1];
            window = msgSegs[2];
            let headers = msg.body.slice(`!resh ${statusCode} ${window} `.length, msg.body.length);
            queue[`${window}-h`] = JSON.parse(headers);
            queue[`${window}-h`][sc] = statusCode;
        } else if (msg.body.startsWith('!res ')) {
            var msgSegs = msg.body.split(' ');
            window = msgSegs[1];
            frame = [2];
            let dataFrame = msg.body.slice(`!res ${window} ${frame} `.length, msg.body.length);
            queue[window].push(dataFrame);

            // waitResponse = true;
        } else if (msg.fromMe && msg.body === 'logMsgs') {
            logMsgs = !logMsgs; // Switch log messages mode
            msg.reply(`Log Messages to the terminal switched to ${logMsgs}`);

            config['logMsgs'] = logMsgs;

            fs.writeFile(serverConfigFileName, JSON.stringify(config), (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });

        } else if (msg.fromMe && msg.body === 'stpsrv') {
            try {
                server.close();
                msg.reply(`ظابط يا مان`);
            } catch (e) {
                msg.reply(`مشكلة في قفل السرفر:\n ${e}`);
            }
        } else if (msg.fromMe && msg.body === 'srv') {
            server.listen(port, host);
            msg.reply(`تمام يا معلم شغالين على: http://64.128.256.512:${port}`);
            // console.log('host', host);
        } else if (msg.body === '!ping') {
            msg.reply('pong');
        } else if (msg.fromMe && msg.body.startsWith('sendto ')) {
            // Direct send a new message to specific id
            let number = msg.body.split(' ')[1];
            let messageIndex = msg.body.indexOf(number) + number.length;
            let message = msg.body.slice(messageIndex, msg.body.length);
            number = number.includes('@c.us') ? number : `${number}@c.us`;
            let chat = await msg.getChat();
            chat.sendSeen();
            client.sendMessage(number, message);
        } else if (msg.fromMe && msg.body.startsWith('!subject ')) {
            // Change the group subject
            let chat = await msg.getChat();
            if (chat.isGroup) {
                let newSubject = msg.body.slice(9);
                chat.setSubject(newSubject);
            } else {
                msg.reply('This command can only be used in a group!');
            }
        } else if (msg.fromMe && msg.body.startsWith('!desc ')) {
            // Change the group description
            let chat = await msg.getChat();
            if (chat.isGroup) {
                let newDescription = msg.body.slice(6);
                chat.setDescription(newDescription);
            } else {
                msg.reply('This command can only be used in a group!');
            }
            // } else if (msg.fromMe && msg.body === '!leave') {
            //     // Leave the group
            //     let chat = await msg.getChat();
            //     if (chat.isGroup) {
            //         chat.leave();
            //     } else {
            //         msg.reply('This command can only be used in a group!');
            //     }
            // } else if (msg.fromMe && msg.body.startsWith('!join ')) {
            //     const inviteCode = msg.body.split(' ')[1];
            //     try {
            //         await client.acceptInvite(inviteCode);
            //         msg.reply('Joined the group!');
            //     } catch (e) {
            //         msg.reply('That invite code seems to be invalid.');
            //     }
        } else if (msg.body === 'groupinfo') {
            let chat = await msg.getChat();
            if (chat.isGroup) {
                msg.reply(`
            *Group Details*
            Name: ${chat.name}
            Description: ${chat.description}
            Created At: ${chat.createdAt.toString()}
            Created By: ${chat.owner.user}
            Participant count: ${chat.participants.length}
        `);
            } else {
                msg.reply('This command can only be used in a group!');
            }
        } else if (msg.fromMe && msg.body === '!chats') {
            const chats = await client.getChats();
            client.sendMessage(msg.from, `The bot has ${chats.length} chats open.`);
        } else if (msg.body === '!info') {
            let info = client.info;
            client.sendMessage(msg.from, `
        *Connection info*
        User name: ${info.pushname}
        My number: ${info.wid.user}
        Platform: ${info.platform}
    `);
        } else if (msg.fromMe && msg.body === 'mediainfo' && msg.hasMedia) {
            const attachmentData = await msg.downloadMedia();
            msg.reply(`
        *Media info*
        MimeType: ${attachmentData.mimetype}
        Filename: ${attachmentData.filename}
        Data (length): ${attachmentData.data.length}
    `);
        } else if (msg.fromMe && msg.body === '!quoteinfo' && msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();

            quotedMsg.reply(`
        ID: ${quotedMsg.id._serialized}
        Type: ${quotedMsg.type}
        Author: ${quotedMsg.author || quotedMsg.from}
        Timestamp: ${quotedMsg.timestamp}
        Has Media? ${quotedMsg.hasMedia}
    `);
        } else if (msg.fromMe && msg.body === '!resendmedia' && msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.hasMedia) {
                const attachmentData = await quotedMsg.downloadMedia();
                client.sendMessage(msg.from, attachmentData, { caption: 'Here\'s your requested media.' });
            }
        } else if (msg.fromMe && msg.body === '!location') {
            msg.reply(new Location(37.422, -122.084, 'Googleplex\nGoogle Headquarters'));
        } else if (msg.location) {
            msg.reply(msg.location);
        } else if (msg.fromMe && msg.body.startsWith('!status ')) {
            const newStatus = msg.body.split(' ')[1];
            await client.setStatus(newStatus);
            msg.reply(`Status was updated to *${newStatus}*`);
        } else if (msg.fromMe && msg.body === '!mention') {
            const contact = await msg.getContact();
            const chat = await msg.getChat();
            chat.sendMessage(`Hi @${contact.number}!`, {
                mentions: [contact]
            });
        } else if (msg.fromMe && msg.body === '!delete') {
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.fromMe) {
                    quotedMsg.delete(true);
                } else {
                    msg.reply('I can only delete my own messages');
                }
            }
        } else if (msg.body.toLowerCase() === 'xdm') {
            greating(msg);
        } else if (msg.body.toLowerCase() === 'all lessons') {
            allLesson(msg);
        } else if (msg.body.toLowerCase() === 'lessons') {
            getLessons(msg);
        } else if (msg.body.toLowerCase().startsWith('l: ')) {
            var lesson = msg.body.slice('l :'.length);
            getLesson(msg, lesson);
        } else if (msg.body.toLowerCase().startsWith('l:')) {
            var lesson = msg.body.slice('l:'.length);
            getLesson(msg, lesson);
        } else if (msg.body.toLowerCase() === 'bot_author_me') {
            // createAuthor(msg, msg.from.id, msg.from.name, msg.from.number);
            var author = msg.from;
            if (author.includes('@g.us')) {
                author = msg.author;
            }
            sendCommand(msg, author, `author`);
        } else if (msg.body.toLowerCase() === 'authors') {
            getAuthors(msg);
            // } else if (msg.body.toLowerCase().startsWith('todo:')) {
            //     var author = msg.from;
            //     if (author.includes('@g.us')) {
            //         author = msg.author;
            //     }
            //     sendCommand(msg, author, `todo`);
            // chatNumber = chatNumber.includes('@c.us') ? chatNumber : `${chatNumber}@c.us`;
            // msg.reply(`Chat number setted to ${chatNumber}`);
            // var todo = msg.body.slice('serverdo:'.length);
            // var todoSegs = todo.split(':');
            // var date = Date.parse(todoSegs[2]);
            // server_do.addToDo(todoSegs[0], todoSegs[1], );
        } else if (msg.body.toLowerCase() === 'commands') {
            getCommands(msg);
        } else if (msg.body.startsWith('@')) {
            var segs = msg.body.slice('@'.length);
            var lesson = segs[0];
        } else if (msg.body.startsWith('!')) {
            var body = {};
            var author = msg.from;
            if (author.includes('@g.us')) {
                console.log(`GID=${author}`);
                body['gid'] = author;
                author = msg.author;
            }
            console.log(`MSG-Author${author}`);
            var command;
            if (msg.body.includes(':')) {
                command = msg.body.slice('!'.length).split(':')[0];
            } else {
                command = msg.body.slice('!'.length);
            }
            body[command.toLowerCase()] = msg.body.slice(`!${command}:`.length);
            sendCommand(msg, author, command.toLowerCase(), body);
        } else if (contentEditMode) {
            currentContent = msg.body;
        }
    } catch {
        //
    }
});

var contentEditMode = false;
var currentContent = '';

function getAuthors(msg) {
    getR(`authors`, msg);
}

function sendCommand(msg, number, command, body) {
    var authorData = {
        ...body
    };
    postR(`command/${number}/${command}`, msg, authorData);
}

function getCommands(msg) {
    getR(`commands`, msg);
}

function getLesson(msg, lesson) {
    getR(`lesson/${lesson}`, msg);
}

function allLesson(msg) {
    getR(`all-lessons`, msg);
}

function getLessons(msg) {
    getR('month-lessons', msg);
}

function greating(msg) {
    getR('greating', msg);
}

var proxyServicePort = 8185;
// var proxyServiceHost = '167.172.167.245';
var proxyServiceHost = '0.0.0.0';
var proxyServiceRef = `http://${proxyServiceHost}:${proxyServicePort}`;

function getOptions(path) {
    var options = {
        href: `${proxyServiceRef}/${path}`,
        origin: `${proxyServiceRef}`,
        protocol: 'http:',
        host: `${proxyServiceHost}:${proxyServicePort}`,
        hostname: `${proxyServiceHost}`,
        port: `${proxyServicePort}`,
        path: `/${path}`,
    }
    return options;
}

function getR(path, msg) {
    var options = getOptions(path);
    options['method'] = 'GET';
    console.log(options);
    try {
        const req = http.request(options, (res) => {
            console.log('Code: ' + res.statusCode);
            if (res.statusCode == 500) {
                msg.react('😢');
                msg.reply('ISE');
                return;
            }
            if (res.statusCode == 404) {
                msg.react('😅');
                msg.reply('NF');
                return;
            }
            res.setEncoding('utf8');
            var answer = '';
            res.on('data', (chunk) => {
                answer = answer + chunk;
            });
            res.on('end', () => {
                console.log('Answer: ' + answer);
                msg.react('👍🏻');
                msg.reply(answer);
            });

        });
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            msg.reply(`problem with request: ${e.message}`);
        });
        req.end();
    } catch (e) {
        msg.reply(e);
    }
}

function postR(path, msg, body) {
    var options = getOptions(path);
    options['method'] = 'POST';
    console.log(options);
    try {
        const req = http.request(options, (res) => {
            console.log('Code: ' + res.statusCode);
            if (res.statusCode == 500) {
                msg.reply('ISE');
                return;
            }
            if (res.statusCode == 404) {
                msg.reply('NF');
                return;
            }
            res.setEncoding('utf8');
            var answer = '';
            res.on('data', (chunk) => {
                answer = answer + chunk;
            });
            res.on('end', () => {
                console.log('Answer: ' + answer);
                msg.react('👍🏻');
                msg.reply(answer);
            });

        });
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            msg.reply(`problem with request: ${e.message}`);
        });
        req.write(JSON.stringify(body));
        req.end();
    } catch (e) {
        msg.reply(e);
    }
}

// xserv.runServer();
runServer();