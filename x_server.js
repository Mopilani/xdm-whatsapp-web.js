const http = require("http");
const express = require("express");
const app = express();

const host = "0.0.0.0";
const port = 8156;

// This server must response for the dart xdm-bot-server
// 1- respond for sending groups contents periodicly

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get("/video", function (req, res) {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    const videoPath = "Kimetsu.mp4";
    const videoSize = fs.statSync("Kimetsu.mp4").size;
    const CHUNK_SIZE = 10 ** 6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
});

export function runServer() {
    app.listen(8000, function () {
        console.log("Listening on port 8000!");
    });
}
