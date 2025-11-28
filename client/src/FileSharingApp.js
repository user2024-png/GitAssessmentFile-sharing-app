import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import ss from "socket.io-stream";
import { QRCodeSVG } from "qrcode.react";

// Single-file, production-ready front-end for your File Sharing App
// Drop this into: client/src/FileSharingApp.js
// Requirements: socket.io-client, socket.io-stream, qrcode.react installed in client
// Server must expose: GET /create-lobby -> { lobbyNum }
// Server socket namespace: /lobby-<lobbyNum>
// Server emits: "lobby-info" { users: [...], file: "filename" }
// Server emits: "file-upload-progress" (number 0-100)
// Server emits: "file-download-end" { fileName }
// Server listens for socket.io-stream event: "file-upload"

export default function FileSharingApp() {
  const [lobbyNum, setLobbyNum] = useState("");
  const [inputLobby, setInputLobby] = useState("");
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [joined, setJoined] = useState(false);

  const [users, setUsers] = useState([]); // array of full socket ids
  const prevUsersRef = useRef([]);

  const [systemMessages, setSystemMessages] = useState([]);
  const [currentFile, setCurrentFile] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // helper to append system messages
  const pushSystem = (text) => {
    setSystemMessages((m) => [...m, { text, ts: Date.now() }]);
  };

  // create lobby on server and auto-join
  const handleCreateLobby = async () => {
    try {
      const res = await fetch("/create-lobby");
      const data = await res.json();
      if (data?.lobbyNum) {
        setLobbyNum(String(data.lobbyNum));
        // join the namespace
        connectToLobby(String(data.lobbyNum));
        setJoined(true);
        pushSystem(`Created lobby ${data.lobbyNum}`);
      } else {
        alert("Could not create lobby (empty response)");
      }
    } catch (err) {
      console.error(err);
      alert("Create lobby failed. See console.");
    }
  };

  // join existing lobby by number
  const handleJoinLobby = () => {
    const id = String(inputLobby).trim();
    if (!id) return alert("Enter lobby number to join");
    setLobbyNum(id);
    connectToLobby(id);
    setJoined(true);
    pushSystem(`Attempting to join lobby ${id}`);
  };

  // connect to namespace (works with Codespaces since we use full origin)
  const connectToLobby = (id) => {
    // if already connected to another socket, disconnect cleanly
    if (socketRef.current) {
      try { socketRef.current.disconnect(); } catch(e){}
      socketRef.current = null;
      setSocket(null);
    }

    const namespaceUrl = `${window.location.origin}/lobby-${id}`;
    const s = io(namespaceUrl, { transports: ["websocket"] });
    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      pushSystem(`Connected to ${s.id}`);
    });

    // primary lobby event (server sends users + file)
    s.on("lobby-info", (payload) => {
      // payload: { users: [...socketIds], file: "fileName" }
      if (payload && Array.isArray(payload.users)) {
        const incoming = payload.users;
        // detect joins / leaves
        const prev = prevUsersRef.current || [];

        incoming.forEach((id) => {
          if (!prev.includes(id)) pushSystem(`User joined: ${shortId(id)}`);
        });
        prev.forEach((id) => {
          if (!incoming.includes(id)) pushSystem(`User left: ${shortId(id)}`);
        });

        prevUsersRef.current = incoming;
        setUsers(incoming);
      }

      if (payload && payload.file) {
        setCurrentFile(payload.file);
        pushSystem(`File available: ${payload.file}`);
      }
    });

    // backward-compat: some older servers emit separate events
    s.on("lobby-user-info", ({ usersInLobby }) => {
      if (Array.isArray(usersInLobby)) {
        prevUsersRef.current = usersInLobby;
        setUsers(usersInLobby);
      }
    });
    s.on("lobby-file-info", ({ fileName }) => {
      if (fileName) { setCurrentFile(fileName); }
    });

    // progress and file-ready
    s.on("file-upload-progress", (pct) => {
      // server might send number or {percent: number}
      const val = typeof pct === "number" ? pct : (pct?.percent ?? 0);
      setUploadProgress(Number(val));
    });

    s.on("file-download-end", ({ fileName }) => {
      if (fileName) {
        setCurrentFile(fileName);
        setUploadProgress(100);
        pushSystem(`File upload completed: ${fileName}`);
      }
    });

    s.on("disconnect", () => {
      pushSystem("Socket disconnected");
      setUsers([]);
    });

    s.on("connect_error", (err) => {
      console.warn("connect_error", err);
      pushSystem("Connection error: " + (err?.message || "unknown"));
    });
  };

  // small helper to shorten socket id
  const shortId = (id) => (id ? id.split("#").pop().slice(0, 10) : "");

  // upload file using socket.io-stream
  const handleFileSelected = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    if (!socketRef.current || !socketRef.current.connected) return alert("Socket not connected");

    if (file.size > 100 * 1024 * 1024) { // 100 MB
      return alert("File too large. Maximum 100 MB allowed.");
    }

    const stream = ss.createStream();
    const meta = { name: file.name, size: file.size };

    // emit the file-upload stream; server listens on ss(socket).on('file-upload', ...)
    ss(socketRef.current).emit("file-upload", stream, meta);

    const blobStream = ss.createBlobReadStream(file);
    let bytes = 0;

    blobStream.on("data", (chunk) => {
      bytes += chunk.length;
      const pct = Math.round((bytes / file.size) * 100);
      setUploadProgress(pct);
      // also inform server in case server expects this event
      try { socketRef.current.emit("file-upload-progress", pct); } catch (e) {}
    });

    blobStream.on("end", () => {
      setUploadProgress(100);
      pushSystem("Upload stream finished, waiting server to finalize...");
    });

    blobStream.on("error", (err) => {
      console.error("blobStream error", err);
      pushSystem("Upload failed: " + String(err));
    });

    // pipe to stream
    blobStream.pipe(stream);
  };

  // download link
  const getDownloadUrl = (fileName) => {
    if (!lobbyNum || !fileName) return "#";
    return `${window.location.origin}/lobby/${lobbyNum}/download/${encodeURIComponent(fileName)}`;
  };

  // render
  return (
    <div style={{ maxWidth: 900, margin: "18px auto", fontFamily: "Inter, Arial, sans-serif", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 6px 30px rgba(15,23,42,0.08)" }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>File Sharing App</h2>

        {/* Create / Join controls */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <button onClick={handleCreateLobby} style={{ padding: "10px 14px", borderRadius: 8, background: "#0ea5a9", color: "white", border: 0, cursor: "pointer" }}>Create Lobby</button>

          <input placeholder="Enter lobby number" value={inputLobby} onChange={(e) => setInputLobby(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", flex: 1 }} />
          <button onClick={handleJoinLobby} style={{ padding: "10px 14px", borderRadius: 8, background: "#2563eb", color: "white", border: 0, cursor: "pointer" }}>Join</button>
        </div>

        {/* lobby area */}
        {lobbyNum ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ color: "#374151" }}>Lobby: <strong>#{lobbyNum}</strong></div>
                <div style={{ color: "#6b7280", marginTop: 4 }}>Users in Lobby: <strong>{users.length}</strong></div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 120, textAlign: "center", background: "#fafafa", padding: 8, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#111" }}>QR (share)</div>
                  <div style={{ marginTop: 8 }}>
                    <QRCodeSVG value={String(lobbyNum)} size={100} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, marginTop: 16 }}>

              {/* Left: users list */}
              <div style={{ background: "#fbfcff", padding: 12, borderRadius: 10, border: "1px solid #eef2ff" }}>
                <h4 style={{ marginTop: 0, marginBottom: 8 }}>Users</h4>
                {users.length === 0 ? (
                  <div style={{ color: "#6b7280" }}>No users yet</div>
                ) : (
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {users.map((u) => (
                      <li key={u} style={{ marginBottom: 6 }}>{shortId(u)}{socketRef.current && u === socketRef.current.id ? " (you)" : ""}</li>
                    ))}
                  </ul>
                )}

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, color: "#374151" }}>Upload (host)</div>
                  {/* only show file input for host (creator) — but if you want host detection, we simply allow when connected and not a guest */}
                  <input type="file" onChange={handleFileSelected} style={{ marginTop: 8 }} />
                </div>
              </div>

              {/* Right: activity / messages / file */}
              <div style={{ background: "#fff", padding: 12, borderRadius: 10, border: "1px solid #eef2ff" }}>
                <h4 style={{ marginTop: 0 }}>Activity</h4>

                <div style={{ maxHeight: 240, overflowY: "auto", padding: 8, background: "#fbfbff", borderRadius: 8 }}>
                  {systemMessages.length === 0 ? (
                    <div style={{ color: "#6b7280" }}>No activity yet</div>
                  ) : (
                    systemMessages.map((m, idx) => (
                      <div key={idx} style={{ marginBottom: 8 }}>
                        <small style={{ color: "#374151" }}>{new Date(m.ts).toLocaleTimeString()} • </small>
                        <span style={{ marginLeft: 6 }}>{m.text}</span>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8 }}><strong>Current file:</strong> {currentFile || <span style={{ color: '#6b7280' }}>none</span>}</div>

                  {currentFile && (
                    <a href={getDownloadUrl(currentFile)} target="_blank" rel="noreferrer" style={{ padding: "8px 12px", background: '#10b981', color: 'white', borderRadius: 8, textDecoration: 'none' }}>Download</a>
                  )}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ height: 8, background: '#eef2ff', borderRadius: 6 }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#2563eb', borderRadius: 6 }} />
                      </div>
                      <div style={{ marginTop: 6 }}>{uploadProgress}%</div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
