import React, { useEffect, useState } from "react";

const DownloadFileCard = ({ lobbyNumber, socket, joinedToLobby }) => {
  const [curFile, setCurFile] = useState(null);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!socket) return;
    const onEnd = ({ fileName }) => { setCurFile(fileName); setPct(100); };
    const onInfo = ({ file }) => { if (file) setCurFile(file); };
    const onProg = n => setPct(n || 0);

    socket.on("file-download-end", onEnd);
    socket.on("lobby-info", onInfo);
    socket.on("file-upload-progress", onProg);

    return () => {
      socket.off("file-download-end", onEnd);
      socket.off("lobby-info", onInfo);
      socket.off("file-upload-progress", onProg);
    };
  }, [socket]);

  const download = () => {
    if (!curFile || !lobbyNumber) return;
    const url = `${window.location.origin}/lobby/${lobbyNumber}/download/${encodeURIComponent(curFile)}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginTop: 12 }}>
      <h4>Receive files</h4>
      {curFile ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>{curFile}</div>
          <button onClick={download}>Download</button>
        </div>
      ) : (
        <div>
          <div style={{ width: "100%", background: "#eee", height: 10, borderRadius: 6 }}>
            <div style={{ width: `${pct}%`, background: "#2196f3", height: "100%", borderRadius: 6 }} />
          </div>
          <div style={{ marginTop: 6 }}>{pct}%</div>
        </div>
      )}
    </div>
  );
};

export default DownloadFileCard;
