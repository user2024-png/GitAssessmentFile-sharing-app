import React, { useState } from "react";

const JoinToLobbyCard = ({ setLobbyNum, setJoinedToLobby }) => {
  const [value, setValue] = useState("");
  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <h4>Join a Room</h4>
      <input placeholder="Lobby id" value={value} onChange={e => setValue(e.target.value)} />
      <div style={{ marginTop: 8 }}>
        <button onClick={() => { if (value) { setLobbyNum(value); setJoinedToLobby(true); } }}>Join</button>
      </div>
    </div>
  );
};

export default JoinToLobbyCard;
