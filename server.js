// server.js
const { app, http } = require("./serverConfig");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const SocketLobby = require("./socket/socket");

// middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// static react build (if you use it)
app.use(express.static(path.join(__dirname, "client", "build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

// create lobby
app.get("/create-lobby", (req, res) => {
  const newLobby = new SocketLobby();
  res.json({ lobbyNum: newLobby.getLobbyNum() });
});

// download a file saved under temporary/lobby-<id>/
app.get("/lobby/:lobbyNum/download/:fileName", (req, res) => {
  const { lobbyNum, fileName } = req.params;
  const filePath = path.join(__dirname, "temporary", `lobby-${lobbyNum}`, fileName);
  res.download(filePath, fileName, err => {
    if (err) {
      console.error("Download error:", err);
      if (!res.headersSent) res.status(404).send("File not found");
    }
  });
});

const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
