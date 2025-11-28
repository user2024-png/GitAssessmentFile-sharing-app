import React from "react";

const UserListCard = ({ users = [], mySocketId }) => {
  const myShort = mySocketId ? mySocketId.split("#")[1] || mySocketId : null;
  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <h4>Users in Lobby</h4>
      {users.length === 0 ? <div>Currently, there are no users in your lobby</div> : (
        <ul>
          {users.map(u => {
            const short = (u && u.includes("#")) ? u.split("#")[1] : u;
            return <li key={u}>{short}{short === myShort ? " (you)" : ""}</li>;
          })}
        </ul>
      )}
    </div>
  );
};

export default UserListCard;
