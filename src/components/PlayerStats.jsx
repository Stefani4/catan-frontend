import { useState } from "react";
import { getColorByIndex } from "../constants/playerColors.js";
import { getAvatarById } from "../constants/avatars.jsx";
import { usePlayerIdentities } from "../hooks/usePlayerIdentities.js";
import { useReactionBursts } from "../hooks/useReactionBursts.js";
import { REACTIONS } from "../constants/reactions.js";
import { useTranslation } from "../i18n.js";

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

export default function PlayerStats({ G, ctx, matchID, moves, playerID }) {
    const { t } = useTranslation();
    const identities = usePlayerIdentities(matchID);
    const bursts = useReactionBursts(G.reactions);
    const [pickerOpen, setPickerOpen] = useState(false);
    const playerIds = Object.keys(G.players);
    const numPlayers = playerIds.length;
    const myId = playerID !== undefined ? String(playerID) : null;

    const react = (emoji) => {
        moves?.sendReaction?.(emoji);
        setPickerOpen(false);
    };

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
                const isMe = myId !== null && myId === String(playerId);
                const burst = bursts[String(playerId)];

                return (
                    <div
                        key={playerId}
                        style={{
                            width: "190px",
                            borderRadius: "10px",
                            overflow: "visible",
                            position: "relative",
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
                        {burst && (
                            <span
                                key={burst.id}
                                className="reaction-bubble"
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: "50%",
                                    fontSize: "1.4rem",
                                    pointerEvents: "none",
                                    zIndex: 5,
                                    filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.5))",
                                }}
                            >
                                {burst.emoji}
                            </span>
                        )}

                        {isMe && moves?.sendReaction && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "6px",
                                    right: "6px",
                                    zIndex: 6,
                                }}
                            >
                                <button
                                    onClick={() => setPickerOpen((v) => !v)}
                                    title={t("sendReactionTt")}
                                    style={{
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "50%",
                                        border: "1px solid rgba(255,255,255,0.5)",
                                        background: "rgba(0,0,0,0.4)",
                                        color: "#f2e6c9",
                                        fontSize: "0.6rem",
                                        lineHeight: 1,
                                        padding: 0,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    😀
                                </button>
                                {pickerOpen && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "22px",
                                            right: 0,
                                            display: "flex",
                                            flexWrap: "wrap",
                                            width: "112px",
                                            gap: "3px",
                                            background: "rgba(20,14,6,0.95)",
                                            border: "1px solid rgba(201,169,110,0.5)",
                                            borderRadius: "8px",
                                            padding: "6px",
                                            boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                                        }}
                                    >
                                        {REACTIONS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => react(emoji)}
                                                style={{
                                                    width: "22px",
                                                    height: "22px",
                                                    border: "none",
                                                    background: "transparent",
                                                    fontSize: "1rem",
                                                    cursor: "pointer",
                                                    padding: 0,
                                                }}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

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
                                title={t("victoryPointsTt")}
                            >
                {player.victoryPoints ?? 0}
                                <span style={{ fontSize: "0.6rem", color: "#c9a96e" }}> {t("ptsLabel")}</span>
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
                            <StatPill icon="🏠" value={settlementCount} title={t("settlementsTt")} />
                            <StatPill
                                icon="🛤️"
                                value={roadCount}
                                title={t("roadsWithChainTt", { n: player.longestRoadLength ?? 0 })}
                            />
                            <StatPill icon="🏰" value={cityCount} title={t("citiesTt")} />
                            {(player.resorts?.length || 0) > 0 && (
                                <StatPill icon="🏖️" value={player.resorts.length} title={t("resortsTt")} />
                            )}
                            <StatPill
                                icon="🎴"
                                value={player.developmentCards?.length || 0}
                                title={t("devCardsTt")}
                            />
                            {player.hasLongestRoad && <StatPill icon="🎗️" value="LR" title={t("longestRoadTt")} />}
                            {player.hasLargestArmy && <StatPill icon="⚔️" value="LA" title={t("largestArmyTt")} />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}