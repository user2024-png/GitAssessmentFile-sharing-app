import React, { useState, useCallback } from "react";
import ss from "socket.io-stream";

const UploadFileCard = ({ lobbyNumber, socket }) => {
  const [file, setFile] = useState(null);
  const [pct, setPct] = useState(0);
  const [status, setStatus] = useState("");

  const choose = e => setFile(e.target.files[0]);

  const upload = useCallback(() => {
    if (!file) return alert("Choose a file");
    if (!socket) return alert("Socket not ready");

    const stream = ss.createStream();
    const blobStream = ss.createBlobReadStream(file);

    let sent = 0;
    blobStream.on("data", chunk => {
      sent += chunk.length;
      const percent = Math.round((sent / file.size) * 100);
      setPct(percent);
      // optional: also inform server (server will broadcast)
      socket.emit("file-upload-progress", percent);
    });

    blobStream.on("end", () => {
      setStatus("Upload finished, waiting server...");
      setPct(100);
    });

    ss(socket).emit("file-upload", stream, { name: file.name, size: file.size });
    blobStream.pipe(stream);

    setStatus("Uploading...");
  }, [file, socket]);

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <h4>Upload File (Host)</h4>
      <input type="file" onChange={choose} />
      <div style={{ marginTop: 8 }}>
        <button onClick={upload} disabled={!file || !socket}>Upload</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ width: "100%", background: "#eee", height: 10, borderRadius: 6 }}>
          <div style={{ width: `${pct}%`, background: "#4caf50", height: "100%", borderRadius: 6 }} />
        </div>
        <div style={{ marginTop: 6 }}>{pct}% - {status}</div>
      </div>
    </div>
  );
};

export default UploadFileCard;
