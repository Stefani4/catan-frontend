import { useEffect, useRef, useState } from "react";
import { getPlayerColor } from "../constants/playerColors.js";

export default function Chat({ G, ctx, moves, playerID }) {
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);
  const messages = G.chatMessages || [];

  const myId = playerID !== undefined ? playerID : ctx.currentPlayer;

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    moves.sendChat(text);
    setDraft("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "320px",
      }}
    >
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              color: "#8a7a5c",
              fontSize: "0.78rem",
              fontStyle: "italic",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            No messages yet — say hello!
          </div>
        )}

        {messages.map((m) => {
          const color = getPlayerColor(m.playerId);
          const isMine = String(m.playerId) === String(myId);
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMine ? "flex-end" : "flex-start",
              }}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: "bold",
                  color: color.soft,
                  marginBottom: "1px",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                {color.name}
              </span>
              <span
                style={{
                  maxWidth: "85%",
                  background: isMine
                    ? "linear-gradient(135deg, #8a5a20, #c9922f)"
                    : "rgba(0,0,0,0.35)",
                  border: `1px solid ${isMine ? "#f1d38a" : "rgba(201,169,110,0.3)"}`,
                  borderRadius: "10px",
                  padding: "5px 10px",
                  color: "#f2e6c9",
                  fontSize: "0.82rem",
                  wordBreak: "break-word",
                  fontFamily: "Georgia, serif",
                }}
              >
                {m.text}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: "6px",
          padding: "10px",
          borderTop: "1px solid rgba(201,169,110,0.3)",
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Type message"
          maxLength={240}
          style={{
            flex: 1,
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(201,169,110,0.4)",
            background: "rgba(0,0,0,0.3)",
            color: "#f2e6c9",
            fontSize: "0.82rem",
            fontFamily: "Georgia, serif",
            outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          style={{
            padding: "7px 12px",
            borderRadius: "6px",
            border: "1px solid #f1d38a",
            background: draft.trim()
              ? "linear-gradient(135deg, #8a5a20, #c9922f)"
              : "#4a4a4a",
            color: "white",
            fontWeight: "bold",
            cursor: draft.trim() ? "pointer" : "not-allowed",
            opacity: draft.trim() ? 1 : 0.6,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
