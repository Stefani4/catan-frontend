import { useEffect, useState } from "react";
import { getPlayerColor } from "../constants/playerColors.js";

const SERVER = "http://localhost:8000";

function StatPill({ icon, value, title }) {
    return (
        <div
            title={title}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(0,0,0,0.25)",
                borderRadius: "6px",
                padding: "2px 7px",
                fontSize: "0.78rem",
                color: "#f2e6c9",
                fontFamily: "Georgia, serif",
                fontWeight: "bold",
            }}
        >
            <span style={{ fontSize: "0.85rem" }}>{icon}</span>
            <span>{value}</span>
        </div>
    );
}

function usePlayerNames(matchID) {
    const [names, setNames] = useState({});

    useEffect(() => {
        if (!matchID) return;
        let cancelled = false;

        const fetchNames = () => {
            fetch(`${SERVER}/games/catan/${matchID}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (cancelled || !data?.players) return;
                    const next = {};
                    data.players.forEach((p) => {
                        if (p.name) next[String(p.id)] = p.name;
                    });
                    setNames(next);
                })
                .catch(() => {});
        };

        fetchNames();
        const interval = setInterval(fetchNames, 4000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [matchID]);

    return names;
}

export default function PlayerStats({ G, ctx, matchID }) {
    const names = usePlayerNames(matchID);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontFamily: "Georgia, serif",
            }}
        >
            {Object.entries(G.players).map(([playerId, player]) => {
                const color = getPlayerColor(playerId);
                const displayName = names[playerId] || `Player ${playerId}`;
                const isCurrent = String(ctx.currentPlayer) === String(playerId);
                const settlementCount = player.settlements?.length || 0;
                const roadCount = player.roads?.length || 0;
                const cityCount = player.cities?.length || 0;

                return (
                    <div
                        key={playerId}
                        style={{
                            width: "190px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: isCurrent
                                ? "2px solid #ffd700"
                                : "1px solid rgba(201,169,110,0.4)",
                            boxShadow: isCurrent
                                ? "0 0 12px rgba(255,215,0,0.5)"
                                : "0 3px 8px rgba(0,0,0,0.4)",
                            background: `linear-gradient(135deg, ${color.bg}, #1c1208)`,
                            transition: "box-shadow 0.3s, border 0.3s",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 10px",
                                borderBottom: `1px solid ${color.accent}66`,
                            }}
                        >
              <span
                  style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: `radial-gradient(circle at 30% 30%, ${color.soft}, ${color.accent})`,
                      border: "1px solid rgba(255,255,255,0.6)",
                      flexShrink: 0,
                  }}
              />
                            <span
                                title={color.name}
                                style={{
                                    color: "#f2e6c9",
                                    fontWeight: "bold",
                                    fontSize: "0.85rem",
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                {displayName}
              </span>
                            <span
                                style={{
                                    fontSize: "1.1rem",
                                    fontWeight: "bold",
                                    color: "#ffd700",
                                    textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                                }}
                                title="Victory Points"
                            >
                {player.victoryPoints ?? 0}
                                <span style={{ fontSize: "0.6rem", color: "#c9a96e" }}> pts</span>
              </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                padding: "8px 10px",
                                flexWrap: "wrap",
                            }}
                        >
                            <StatPill icon="🏠" value={settlementCount} title="Settlements" />
                            <StatPill
                                icon="🛤️"
                                value={roadCount}
                                title={`Roads (longest chain: ${player.longestRoadLength ?? 0})`}
                            />
                            <StatPill icon="🏰" value={cityCount} title="Cities" />
                            {(player.resorts?.length || 0) > 0 && (
                                <StatPill icon="🏖️" value={player.resorts.length} title="Resorts" />
                            )}
                            <StatPill
                                icon="🎴"
                                value={player.developmentCards?.length || 0}
                                title="Development Cards"
                            />
                            {player.hasLongestRoad && <StatPill icon="🎗️" value="LR" title="Longest Road" />}
                            {player.hasLargestArmy && <StatPill icon="⚔️" value="LA" title="Largest Army" />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
