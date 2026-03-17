import React, { useState } from 'react';
export default function SendPushTest() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");

  const sendPush = async () => {
    await fetch("https://timeo-backend.onrender.com/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        title: "TIMEO ADMIN",
        body: message,
      }),
    });

    alert("Push enviado 🚀");
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Enviar Push</h3>

      <input
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />

      <input
        placeholder="Mensaje"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendPush}>
        Enviar
      </button>
    </div>
  );
}