const { http } = require("../serverConfig");
const io = require("socket.io")(http, {
  maxHttpBufferSize: 100 * 1024 * 1024 // allow uploads up to 100MB
});
const ss = require("socket.io-stream");
const path = require("path");
const fs = require("fs");
const util = require("util");

const unlink = util.promisify(fs.unlink);
const readdir = util.promisify(fs.readdir);

// store namespaces to avoid duplicates
const socketLobbies = new Map();

// ensure /temporary exists
const BASE_TMP = path.join(__dirname, "..", "temporary");
if (!fs.existsSync(BASE_TMP)) {
  fs.mkdirSync(BASE_TMP, { recursive: true });
}

class SocketLobby {
  constructor(lobbyNum = Date.now()) {
    this._lobbyNum = lobbyNum;

    // avoid duplicate namespace
    if (socketLobbies.has(lobbyNum)) {
      console.log(`[SocketLobby] Namespace already exists: /lobby-${lobbyNum}`);
      return socketLobbies.get(lobbyNum);
    }

    this._lobby = io.of("/lobby-" + this._lobbyNum);
    this._users = [];
    this.file = ""; // ⭐ IMPORTANT → client expects "file", NOT "fileName"

    socketLobbies.set(lobbyNum, this._lobby);

    console.log(`[SocketLobby] Namespace created: /lobby-${this._lobbyNum}`);

    this._lobby.on("connection", (socket) => {
      console.log(`[SocketLobby:${this._lobbyNum}] socket connected: ${socket.id}`);

      this._addUser(socket);
      this._broadcastLobbyInfo();

      this._handleDisconnect(socket);
      this._handleProgress(socket);
      this._handleFileUpload(socket);
    });
  }

  getLobbyNum() {
    return this._lobbyNum;
  }

  // -------------------------------
  // Handle file upload
  // -------------------------------
  _handleFileUpload(socket) {
    ss(socket).on("file-upload", (stream, data) => {
      const fileName = path.basename(data.name);
      this.file = fileName; // ⭐ client expects this field

      const folder = path.join(BASE_TMP, "lobby-" + this._lobbyNum);

      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

      const destPath = path.join(folder, fileName);
      console.log(`[SocketLobby:${this._lobbyNum}] Uploading: ${destPath}`);

      const writeStream = fs.createWriteStream(destPath);
      stream.pipe(writeStream);

      stream.on("end", () => {
        console.log(`[SocketLobby:${this._lobbyNum}] File "${fileName}" uploaded.`);

        this._lobby.emit("file-ready", { file: fileName }); // ⭐ matching client
        this._broadcastLobbyInfo(); // also update lobby

        this._cleanupLater(fileName);
      });

      stream.on("error", (err) => {
        console.error(`[SocketLobby:${this._lobbyNum}] Stream error:`, err);
      });
    });
  }

  // -------------------------------
  // Progress
  // -------------------------------
  _handleProgress(socket) {
    socket.on("file-upload-progress", (pct) => {
      this._lobby.emit("file-upload-progress", pct);
    });
  }

  // -------------------------------
  // Connect / Disconnect handling
  // -------------------------------
  _addUser(socket) {
    this._users.push(socket.id);
    console.log(`[SocketLobby:${this._lobbyNum}] Users: ${this._users.length}`);
  }

  _handleDisconnect(socket) {
    socket.on("disconnect", () => {
      this._users = this._users.filter((u) => u !== socket.id);
      console.log(`[SocketLobby:${this._lobbyNum}] Disconnected: ${socket.id}`);
      this._broadcastLobbyInfo();
    });
  }

  // -------------------------------
  // Send lobby-info (client expects "file")
  // -------------------------------
  _broadcastLobbyInfo() {
    this._lobby.emit("lobby-info", {
      users: this._users,
      file: this.file || "" // ⭐ correct field name
    });

    console.log(
      `[SocketLobby:${this._lobbyNum}] lobby-info → users=${this._users.length}, file=${this.file}`
    );
  }

  // -------------------------------
  // Cleanup
  // -------------------------------
  _cleanupLater(fileName) {
    const folder = path.join(BASE_TMP, "lobby-" + this._lobbyNum);
    const filePath = path.join(folder, fileName);

    setTimeout(async () => {
      try {
        if (fs.existsSync(filePath)) {
          await unlink(filePath);
          console.log(`[SocketLobby:${this._lobbyNum}] Deleted file: ${fileName}`);
        }

        const files = await readdir(folder);
        if (files.length === 0) {
          fs.rmSync(folder, { recursive: true, force: true });
          console.log(`[SocketLobby:${this._lobbyNum}] Deleted empty folder.`);
        }
      } catch (err) {
        console.error(`[SocketLobby:${this._lobbyNum}] Cleanup error`, err);
      }
    }, 30 * 60 * 1000);
  }
}

module.exports = SocketLobby;
