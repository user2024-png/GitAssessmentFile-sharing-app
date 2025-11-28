import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

import CreateLobbyCard from "../CreateLobbyCard/CreateLobbyCard";
import UploadFileCard from "../UploadFileCard/UploadFileCard";
import JoinToLobbyCard from "../JoinToLobbyCard/JoinToLobbyCard";
import UserListCard from "../UserListCard/UserListCard";
import ChatArea from "../ChatArea/ChatArea";
import DownloadFileCard from "../DownloadFileCard/DownloadFileCard";

const FileSharingBox = () => {
  const [lobbyNum, setLobbyNum] = useState(null);
  const [joinedToLobby, setJoinedToLobby] = useState(false);

  const socketRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!lobbyNum) return;
    // build full origin + namespace so Codespaces proxies work
    const namespace = `${window.location.origin}/lobby-${lobbyNum}`;
    const sckt = io(namespace, { transports: ["websocket"] });
    socketRef.current = sckt;

    sckt.on("connect", () => pushSystem(`connected: ${sckt.id}`));
    sckt.on("lobby-info", ({ users: usersList, file }) => {
      setUsers(Array.isArray(usersList) ? usersList : []);
      if (file) pushFile(file);
    });
    sckt.on("file-upload-progress", pct => pushSystem(`upload: ${pct}%`));
    sckt.on("file-download-end", ({ fileName }) => pushFile(fileName));
    sckt.on("disconnect", () => pushSystem("disconnected"));

    return () => {
      sckt.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyNum]);

  const pushSystem = text => setMessages(m => [...m, { type: "system", text }]);
  const pushFile = fileName => setMessages(m => [...m, { type: "file", fileName }]);

  // UI selection
  let topCard;
  if (!lobbyNum) {
    topCard = <CreateLobbyCard setLobbyNum={n => { setLobbyNum(n); setJoinedToLobby(true); }} setJoinedToLobby={setJoinedToLobby} />;
  } else if (!joinedToLobby) {
    topCard = <JoinToLobbyCard setLobbyNum={n => setLobbyNum(n)} setJoinedToLobby={setJoinedToLobby} />;
  } else {
    topCard = <UploadFileCard lobbyNumber={lobbyNum} socket={socketRef.current} />;
  }

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ width: 260 }}>
        <div style={{ marginBottom: 12 }}>{lobbyNum ? `Lobby: #${lobbyNum}` : ""}</div>
        <UserListCard users={users} mySocketId={socketRef.current?.id} />
      </div>

      <div style={{ flex: 1 }}>
        {topCard}
        <DownloadFileCard lobbyNumber={lobbyNum} socket={socketRef.current} joinedToLobby={joinedToLobby} />
        <ChatArea messages={messages} />
      </div>
    </div>
  );
};

export default FileSharingBox;
