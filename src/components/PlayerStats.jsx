import { getColorByIndex } from "../constants/playerColors.js";
import { getAvatarById } from "../constants/avatars.jsx";
import { usePlayerIdentities } from "../hooks/usePlayerIdentities.js";

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

export default function PlayerStats({ G, ctx, matchID }) {
    const identities = usePlayerIdentities(matchID);
    const playerIds = Object.keys(G.players);
    const numPlayers = playerIds.length;

    const useGrid = numPlayers >= 4;
    const rows = useGrid ? Math.ceil(numPlayers / 2) : numPlayers;

    return (
        <div
            style={
                useGrid
                    ? {
                        display: "grid",
                        gridTemplateRows: `repeat(${rows}, auto)`,
                        gridAutoFlow: "column",
                        columnGap: "10px",
                        rowGap: "10px",
                        fontFamily: "Georgia, serif",
                    }
                    : {
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        fontFamily: "Georgia, serif",
                    }
            }
        >
            {playerIds.map((playerId) => {
                const player = G.players[playerId];
                const identity = identities[playerId];
                const color = getColorByIndex(identity ? identity.colorIndex : (parseInt(playerId, 10) % 9));
                const displayName = identity?.name || `Player ${playerId}`;
                const AvatarIcon = identity?.avatarId ? getAvatarById(identity.avatarId).Icon : null;
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `radial-gradient(circle at 30% 30%, ${color.soft}, ${color.accent})`,
                      border: "1px solid rgba(255,255,255,0.6)",
                      flexShrink: 0,
                  }}
              >
                  {AvatarIcon && <AvatarIcon size={10} color="#f2e6c9" />}
              </span>
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
