import { useEffect, useState, useRef } from "react";
import catanLogo from "../images/catanlogo.png";
import { getPlayerColor } from "./constants/playerColors.js";
import { getSavedPlayerName } from "./MainMenu.jsx";
import GameSetupModal from "./GameSetupModal.jsx";
import { GAME_SETTINGS_DEFAULTS } from "../game/constants.js";
import { getThemeImage } from "./theme.js";
import { subscribeToSettings } from "./settingsStore.js";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function AdvancedRulesPanel({ matchID }) {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`${SERVER}/games/catan/${matchID}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data) {
                    // Falls back to defaults for older/local matches created before
                    // this match had setupData at all.
                    setSettings({ ...GAME_SETTINGS_DEFAULTS, ...(data.setupData || {}) });
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [matchID]);

    return (
        <div
            style={{
                width: "360px",
                borderRadius: "14px",
                border: "3px solid #7a5320",
                background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                padding: "14px 16px",
                fontFamily: "Georgia, serif",
                color: "#3a2409",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "1.05rem",
                    marginBottom: "10px",
                    borderBottom: "2px solid #7a5320",
                    paddingBottom: "6px",
                }}
            >
                📜 Advanced Rules
            </div>
            {settings ? (
                <GameSetupModal settings={settings} readOnly />
            ) : (
                <p style={{ textAlign: "center", fontSize: "0.85rem", fontStyle: "italic" }}>
                    Loading match rules…
                </p>
            )}
            <p style={{ fontSize: "0.62rem", color: "#8a7458", fontStyle: "italic", marginTop: "8px", marginBottom: 0, textAlign: "center" }}>
                Locked in by the host when this lobby was created.
            </p>
        </div>
    );
}

function SettlersPanel({ matchID, numPlayers, mySeat, players, onCopyLink }) {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        onCopyLink();
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div
            style={{
                width: "230px",
                borderRadius: "14px",
                border: "3px solid #7a5320",
                background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                padding: "16px",
                fontFamily: "Georgia, serif",
                color: "#3a2409",
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "1.15rem",
                    marginBottom: "12px",
                    borderBottom: "2px solid #7a5320",
                    paddingBottom: "8px",
                }}
            >
                Settlers
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Array.from({ length: numPlayers }, (_, i) => String(i)).map((seat) => {
                    const joined = players.find((p) => String(p.id) === seat && p.name);
                    const color = getPlayerColor(seat);
                    const isMe = seat === mySeat;
                    return (
                        <div
                            key={seat}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "5px 8px",
                                borderRadius: "8px",
                                background: isMe ? "rgba(122,83,32,0.18)" : "transparent",
                            }}
                        >
              <span
                  style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: joined
                          ? `radial-gradient(circle at 30% 30%, ${color.soft}, ${color.accent})`
                          : "rgba(0,0,0,0.15)",
                      border: "1px solid rgba(0,0,0,0.3)",
                      flexShrink: 0,
                  }}
              />
                            <span
                                style={{
                                    fontSize: "0.9rem",
                                    fontStyle: joined ? "normal" : "italic",
                                    color: joined ? "#3a2409" : "#8a7458",
                                    fontWeight: isMe ? "bold" : "normal",
                                }}
                            >
                {joined ? joined.name : `Waiting for player ${seat}…`}
                                {isMe ? " (you)" : ""}
              </span>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={copy}
                style={{
                    width: "100%",
                    marginTop: "14px",
                    padding: "9px",
                    borderRadius: "8px",
                    border: "2px solid #7a5320",
                    background: copied ? "#a8c98a" : "#7a5320",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                }}
            >
                {copied ? "✓ Copied!" : "Copy Link"}
            </button>
        </div>
    );
}

// NOTE: this is a local-only placeholder — messages are not sent to other
// players yet. Real synced pre-game chat is intentionally left for later.
function LobbyChatPlaceholder() {
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const listRef = useRef(null);
    const name = getSavedPlayerName();

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages.length]);

    const send = () => {
        const text = draft.trim();
        if (!text) return;
        setMessages((m) => [...m, { name, text }]);
        setDraft("");
    };

    return (
        <div
            style={{
                width: "300px",
                borderRadius: "14px",
                border: "3px solid #7a5320",
                background: "linear-gradient(160deg, #f1e4bf, #e2cd9c)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                overflow: "hidden",
                fontFamily: "Georgia, serif",
                color: "#3a2409",
            }}
        >
            <div
                style={{
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    textAlign: "center",
                    padding: "10px",
                    borderBottom: "2px solid #7a5320",
                }}
            >
                Chat
            </div>
            <div
                ref={listRef}
                style={{
                    height: "150px",
                    overflowY: "auto",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                }}
            >
                {messages.length === 0 && (
                    <div style={{ fontStyle: "italic", fontSize: "0.8rem", color: "#8a7458", textAlign: "center", marginTop: "16px" }}>
                        No messages yet — say hello!
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} style={{ fontSize: "0.82rem" }}>
                        <b>{m.name}:</b> {m.text}
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: "6px", padding: "10px", borderTop: "2px solid #7a5320" }}>
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Type message here"
                    style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #7a5320",
                        background: "rgba(255,255,255,0.5)",
                        color: "#3a2409",
                        fontFamily: "Georgia, serif",
                    }}
                />
                <button
                    onClick={send}
                    style={{
                        padding: "7px 12px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#7a5320",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    ➤
                </button>
            </div>
        </div>
    );
}

export default function LobbyRoom({ matchID, numPlayers, mySeat, onLeave, onStart }) {
    const name = getSavedPlayerName();
    const [players, setPlayers] = useState([]);
    const [theme, setTheme] = useState("sunset");

    useEffect(() => subscribeToSettings((s) => setTheme(s.theme)), []);

    useEffect(() => {
        let cancelled = false;

        async function poll() {
            try {
                const res = await fetch(`${SERVER}/games/catan/${matchID}`);
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) setPlayers(data.players || []);
            } catch (e) {
                // server unreachable — leave the last known list showing
            }
        }

        poll();
        const interval = setInterval(poll, 2000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [matchID]);

    const joinedCount = players.filter((p) => p.name).length;
    const canStart = joinedCount >= 2;

    const copyLink = () => {
        const url = `${window.location.origin}${window.location.pathname}?matchID=${matchID}`;
        navigator.clipboard?.writeText(url).catch(() => {});
    };

    return (
        <div
            style={{
                height: "100vh",
                width: "100vw",
                position: "relative",
                backgroundImage: `url(${getThemeImage(theme)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                overflow: "hidden",
                paddingTop: "14px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: "18px",
                    left: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(20,14,6,0.6)",
                    border: "2px solid #c9a96e",
                    borderRadius: "999px",
                    padding: "6px 16px 6px 6px",
                }}
            >
                <div
                    style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #8a5a20, #c9922f)",
                        border: "2px solid #f1d38a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                    }}
                >
                    👤
                </div>
                <span style={{ color: "#f2e6c9", fontWeight: "bold", fontFamily: "Georgia, serif" }}>
          {name}
        </span>
            </div>

            <img src={catanLogo} alt="Catan" style={{ width: "min(220px, 30vw)", marginBottom: "12px", flexShrink: 0 }} />

            <div
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    gap: "20px",
                    padding: "0 30px",
                    boxSizing: "border-box",
                    overflow: "hidden",
                }}
            >
                <LobbyChatPlaceholder />
                <AdvancedRulesPanel matchID={matchID} />
                <SettlersPanel matchID={matchID} numPlayers={numPlayers} mySeat={mySeat} players={players} onCopyLink={copyLink} />
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    margin: "14px 0",
                    flexShrink: 0,
                }}
            >
                <div style={{ display: "flex", gap: "16px" }}>
                    <button
                        onClick={onLeave}
                        style={{
                            padding: "12px 26px",
                            borderRadius: "8px",
                            border: "2px solid #c9a96e",
                            background: "rgba(20,14,6,0.75)",
                            color: "#f2e6c9",
                            fontFamily: "Georgia, serif",
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                    >
                        Leave
                    </button>
                    <button
                        onClick={onStart}
                        disabled={!canStart}
                        title={canStart ? undefined : "Need at least 2 players to start"}
                        style={{
                            padding: "12px 32px",
                            borderRadius: "8px",
                            border: `2px solid ${canStart ? "#f1d38a" : "#666"}`,
                            background: canStart
                                ? "linear-gradient(135deg, #8a5a20, #c9922f)"
                                : "#4a4a4a",
                            color: "white",
                            fontFamily: "Georgia, serif",
                            fontWeight: "bold",
                            fontSize: "1.05rem",
                            cursor: canStart ? "pointer" : "not-allowed",
                            opacity: canStart ? 1 : 0.65,
                        }}
                    >
                        Start Game
                    </button>
                </div>
                {!canStart && (
                    <span style={{ fontSize: "0.78rem", color: "#f2e6c9", fontStyle: "italic", textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}>
            Waiting for at least 2 players to join ({joinedCount}/{numPlayers} so far)…
          </span>
                )}
            </div>
        </div>
    );
}
