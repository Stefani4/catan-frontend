import { useState } from "react";
import TradingPost from "./Trading.jsx";
import Chat from "./Chat.jsx";

export default function SidePanel({ G, ctx, moves, playerID, matchID, tab: controlledTab, onTabChange }) {
    const [internalTab, setInternalTab] = useState("trades");
    const tab = controlledTab ?? internalTab;
    const setTab = onTabChange ?? setInternalTab;

    const hasIncomingOffer =
        G.activeOffer && String(G.activeOffer.to) === String(playerID);

    const tabButton = (id, label, alert) => (
        <button
            onClick={() => setTab(id)}
            style={{
                position: "relative",
                flex: 1,
                padding: "8px",
                fontWeight: "bold",
                fontFamily: "Georgia, serif",
                fontSize: "0.85rem",
                cursor: "pointer",
                border: "2px solid #c9a96e",
                borderBottom: tab === id ? "none" : "2px solid #c9a96e",
                borderRadius: "10px 10px 0 0",
                background:
                    tab === id
                        ? "linear-gradient(135deg, #4a2000, #8a5a20)"
                        : "rgba(0,0,0,0.45)",
                color: tab === id ? "#fff" : "#c9a96e",
                marginBottom: tab === id ? "-2px" : "0",
                zIndex: tab === id ? 2 : 1,
            }}
        >
            {label}
            {alert && (
                <span
                    style={{
                        position: "absolute",
                        top: "4px",
                        right: "8px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#ff4d4d",
                        boxShadow: "0 0 4px rgba(255,0,0,0.8)",
                    }}
                />
            )}
        </button>
    );

    return (
        <div style={{ width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", gap: "6px" }}>
                {tabButton("trades", "⚓ Trades", hasIncomingOffer)}
                {tabButton("chat", "💬 Chat", false)}
            </div>

            <div style={{ display: tab === "trades" ? "block" : "none" }}>
                <TradingPost G={G} ctx={ctx} moves={moves} playerID={playerID} matchID={matchID} />
            </div>

            <div
                style={{
                    display: tab === "chat" ? "block" : "none",
                    borderRadius: "0 12px 12px 12px",
                    overflow: "hidden",
                    border: "2px solid #c9a96e",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    background: "linear-gradient(180deg, #1c1208, #2c1e0e)",
                }}
            >
                <Chat G={G} ctx={ctx} moves={moves} playerID={playerID} matchID={matchID} />
            </div>
        </div>
    );
}
