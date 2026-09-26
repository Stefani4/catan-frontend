import { useEffect, useState } from "react";
import { getColorByIndex, getPlayerColor } from "../constants/playerColors.js";
import { usePlayerIdentities } from "../hooks/usePlayerIdentities.js";
import { useTranslation } from "../i18n.js";
import PostGameStats from "./PostGameStats.jsx";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";
const POLL_MS = 2500;

export default function VictoryModal({ G, ctx, playerID, matchID, bots, onStartRematch, onLeave }) {
    const { t } = useTranslation();
    const winnerId = ctx.gameover?.winner;
    const identities = usePlayerIdentities(matchID);
    const [rematchInfo, setRematchInfo] = useState(null);
    const [joining, setJoining] = useState(false);
    const [rematchError, setRematchError] = useState(null);
    const [showStats, setShowStats] = useState(false);

    const isOver = winnerId !== undefined && winnerId !== null;

    // Poll for a rematch someone else may have already started, so this
    // client can offer "Join Rematch" instead of spinning up a second match.
    useEffect(() => {
        if (!isOver || !matchID) return undefined;
        let cancelled = false;

        const poll = () => {
            fetch(`${SERVER}/games/catan/${matchID}/rematch`)
                .then((r) => (r.ok ? r.json() : null))
                .then((info) => {
                    if (!cancelled) setRematchInfo(info);
                })
                .catch(() => {});
        };

        poll();
        const timer = setInterval(poll, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [isOver, matchID]);

    if (!isOver) return null;

    if (showStats) {
        return (
            <PostGameStats
                G={G}
                ctx={ctx}
                matchID={matchID}
                onBack={() => setShowStats(false)}
                onClose={() => setShowStats(false)}
            />
        );
    }

    const winner = G.players?.[winnerId];
    const identity = identities[String(winnerId)];
    const color = identity ? getColorByIndex(identity.colorIndex) : getPlayerColor(winnerId);
    const winnerName = identity?.name || `Player ${winnerId}`;
    const isMe = playerID !== undefined && playerID !== null && String(playerID) === String(winnerId);

    const proposerName = rematchInfo
        ? identities[String(rematchInfo.proposedBy)]?.name || `Player ${rematchInfo.proposedBy}`
        : null;

    const handleRematch = async () => {
        if (!onStartRematch || joining) return;
        setJoining(true);
        setRematchError(null);
        try {
            await onStartRematch({
                oldMatchID: matchID,
                mySeat: playerID,
                numPlayers: ctx.numPlayers,
                settings: G.settings,
                bots,
            });
        } catch {
            setRematchError(t("rematchError"));
        } finally {
            setJoining(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.72)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 200,
            }}
        >
            <div
                style={{
                    background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                    border: `4px solid ${color.accent}`,
                    borderRadius: "16px",
                    padding: "34px 44px",
                    textAlign: "center",
                    fontFamily: "Georgia, serif",
                    color: "#3a2409",
                    minWidth: "320px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                }}
            >
                <div style={{ fontSize: "2.4rem", marginBottom: "6px" }}>🏆</div>
                <h1 style={{ margin: "0 0 6px 0", fontSize: "1.6rem" }}>
                    {isMe ? t("youWin") : t("winnerWins", { name: winnerName })}
                </h1>
                <p style={{ margin: "0 0 18px 0", fontSize: "0.95rem", color: "#5a4326" }}>
                    {t("reachedVp", { name: winnerName, vp: winner?.victoryPoints ?? 10 })}
                </p>

                {rematchInfo && (
                    <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", color: "#7a5320" }}>
                        {t("rematchProposed", { name: proposerName })}
                    </p>
                )}
                {rematchError && (
                    <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", color: "#8a2020" }}>
                        {rematchError}
                    </p>
                )}

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                        onClick={() => setShowStats(true)}
                        style={{
                            padding: "10px 22px",
                            borderRadius: "8px",
                            border: `2px solid ${color.accent}`,
                            background: "rgba(255,255,255,0.4)",
                            color: "#3a2409",
                            fontWeight: "bold",
                            fontFamily: "Georgia, serif",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                        }}
                    >
                        {t("statsBtn")}
                    </button>
                    {onStartRematch && (
                        <button
                            onClick={handleRematch}
                            disabled={joining}
                            style={{
                                padding: "10px 22px",
                                borderRadius: "8px",
                                border: "2px solid #f1d38a",
                                background: joining
                                    ? "rgba(122,83,32,0.5)"
                                    : "linear-gradient(135deg, #8a5a20, #c9922f)",
                                color: "white",
                                fontWeight: "bold",
                                fontFamily: "Georgia, serif",
                                fontSize: "0.9rem",
                                cursor: joining ? "default" : "pointer",
                            }}
                        >
                            {joining
                                ? t("joining")
                                : rematchInfo
                                    ? t("joinRematch")
                                    : t("rematch")}
                        </button>
                    )}
                    {onLeave && (
                        <button
                            onClick={onLeave}
                            style={{
                                padding: "10px 22px",
                                borderRadius: "8px",
                                border: `2px solid ${color.accent}`,
                                background: "rgba(255,255,255,0.4)",
                                color: "#3a2409",
                                fontWeight: "bold",
                                fontFamily: "Georgia, serif",
                                fontSize: "0.9rem",
                                cursor: "pointer",
                            }}
                        >
                            {t("backToMenu")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}