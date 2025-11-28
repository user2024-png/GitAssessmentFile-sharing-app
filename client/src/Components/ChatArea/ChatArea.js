import React, { useRef, useEffect } from "react";

const ChatArea = ({ messages = [] }) => {
  const endRef = useRef();
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);
  return (
    <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <h4>Messages</h4>
      <div style={{ maxHeight: 220, overflowY: "auto", padding: 8, background: "#fafafa", borderRadius: 6 }}>
        {messages.length === 0 ? <div style={{ color: "#888" }}>No messages yet</div> :
          messages.map((m, i) => <div key={i} style={{ marginBottom: 6 }}>{m.type === "system" ? `• ${m.text}` : (m.type === "file" ? `File: ${m.fileName}` : JSON.stringify(m))}</div>)
        }
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default ChatArea;
