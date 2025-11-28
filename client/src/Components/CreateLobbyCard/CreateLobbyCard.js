import React, { useCallback } from "react";
import axios from "axios";

const CreateLobbyCard = ({ setLobbyNum, setJoinedToLobby }) => {
  const createLobby = useCallback(() => {
    axios.get("/create-lobby")
      .then(r => r.data)
      .then(data => {
        if (data.lobbyNum) {
          setLobbyNum(data.lobbyNum);
          setJoinedToLobby(true);
        }
      }).catch(err => {
        console.error("create-lobby error", err);
        alert("Could not create lobby");
      });
  }, [setLobbyNum, setJoinedToLobby]);

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <h4>Create Lobby</h4>
      <p>Click + to create a temporary lobby. Share the number with others.</p>
      <button onClick={createLobby} style={{ fontSize: 24, padding: "6px 12px" }}>+</button>
    </div>
  );
};

export default CreateLobbyCard;
