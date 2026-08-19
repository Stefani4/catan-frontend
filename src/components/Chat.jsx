import { useEffect, useRef, useState } from "react";
import { getColorByIndex } from "../constants/playerColors.js";
import { decodePlayerIdentity } from "../profileStore.js";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function usePlayerIdentities(matchID) {
    const [identities, setIdentities] = useState({});

    useEffect(() => {
        if (!matchID) return;
        let cancelled = false;

        const fetchIdentities = () => {
            fetch(`${SERVER}/games/catan/${matchID}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (cancelled || !data?.players) return;
                    const next = {};
                    data.players.forEach((p) => {
                        if (p.name) next[String(p.id)] = decodePlayerIdentity(p.name, p.id);
                    });
                    setIdentities(next);
                })
                .catch(() => {});
        };

        fetchIdentities();
        const interval = setInterval(fetchIdentities, 4000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [matchID]);

    return identities;
}

export default function Chat({ G, ctx, moves, playerID, matchID }) {
    const [draft, setDraft] = useState("");
    const listRef = useRef(null);
    const messages = G.chatMessages || [];
    const identities = usePlayerIdentities(matchID);

    const myId = playerID !== undefined ? playerID : ctx.currentPlayer;

    const nameFor = (pid) => identities[String(pid)]?.name || `Player ${pid}`;
    const colorFor = (pid) =>
        getColorByIndex(identities[String(pid)] ? identities[String(pid)].colorIndex : parseInt(pid, 10) % 9);

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
                    if (m.system) {
                        const text = m.targetPlayerId !== undefined
                            ? m.text.replace("{target}", nameFor(m.targetPlayerId))
                            : m.text;
                        return (
                            <div
                                key={m.id}
                                style={{
                                    textAlign: "center",
                                    fontSize: "0.72rem",
                                    fontStyle: "italic",
                                    color: "#c9a96e",
                                    padding: "2px 6px",
                                }}
                            >
                <span style={{ fontWeight: "bold", color: colorFor(m.playerId).soft }}>
                  {nameFor(m.playerId)}
                </span>{" "}
                                {text}
                            </div>
                        );
                    }

                    const color = colorFor(m.playerId);
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
                {nameFor(m.playerId)}
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
