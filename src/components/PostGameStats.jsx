import brickCard from "../../images/brickCard.png";
import lumberCard from "../../images/lumberCard.png";
import grainCard from "../../images/grainCard.png";
import woolCard from "../../images/woolCard.png";
import oreCard from "../../images/oreCard.png";
import { getColorByIndex, getPlayerColor } from "../constants/playerColors.js";
import { usePlayerIdentities } from "../hooks/usePlayerIdentities.js";
import { useTranslation } from "../i18n.js";

const RES_ICON = { lumber: lumberCard, brick: brickCard, grain: grainCard, wool: woolCard, ore: oreCard };
const RES_KEY = { lumber: "resLumber", brick: "resBrick", grain: "resGrain", wool: "resWool", ore: "resOre" };

function DiceHistogram({ diceRolls, t }) {
    const totals = Array.from({ length: 11 }, (_, i) => i + 2);
    const max = Math.max(1, ...totals.map((n) => diceRolls?.[n] || 0));
    const mostRolled = totals.reduce(
        (best, n) => ((diceRolls?.[n] || 0) > (diceRolls?.[best] || 0) ? n : best),
        2,
    );

    return (
        <div style={{ marginBottom: "22px" }}>
            <h4 style={{ margin: "0 0 4px 0", color: "#c9a96e" }}>{t("statsDiceRolls")}</h4>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.75rem", color: "#a89572" }}>
                {t("statsMostRolled")}: <b>{mostRolled}</b> ({diceRolls?.[mostRolled] || 0} {t("statsRolls")})
            </p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "110px" }}>
                {totals.map((n) => {
                    const count = diceRolls?.[n] || 0;
                    const heightPct = (count / max) * 100;
                    return (
                        <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                            <span style={{ fontSize: "0.65rem", color: "#c9a96e", marginBottom: "2px" }}>{count || ""}</span>
                            <div
                                style={{
                                    width: "100%",
                                    height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%`,
                                    background: n === mostRolled ? "linear-gradient(180deg, #f1d38a, #c9922f)" : "linear-gradient(180deg, #8a6a3a, #5a4326)",
                                    borderRadius: "3px 3px 0 0",
                                    minHeight: count > 0 ? "3px" : "0",
                                }}
                            />
                            <span style={{ fontSize: "0.68rem", color: "#a89572", marginTop: "3px" }}>{n}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PlayerStatCard({ playerId, player, stats, identity, isWinner, t }) {
    const color = identity ? getColorByIndex(identity.colorIndex) : getPlayerColor(playerId);
    const name = identity?.name || `Player ${playerId}`;
    const resources = stats?.resourcesCollected?.[playerId] || {};
    const totalResources = Object.values(resources).reduce((a, b) => a + b, 0);

    return (
        <div
            style={{
                border: `2px solid ${isWinner ? "#f1d38a" : color.accent}`,
                borderRadius: "10px",
                background: `linear-gradient(135deg, ${color.bg}, #1c1208)`,
                padding: "14px",
                boxShadow: isWinner ? "0 0 14px rgba(241,211,138,0.5)" : "none",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: color.soft, display: "inline-block" }} />
                <b style={{ color: "#f2e6c9" }}>{name}</b>
                {isWinner && <span style={{ marginLeft: "auto", fontSize: "1.1rem" }}>🏆</span>}
                <span style={{ marginLeft: isWinner ? 0 : "auto", color: "#c9a96e", fontSize: "0.85rem" }}>
                    {player.victoryPoints ?? 0} VP
                </span>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "0.72rem", color: "#c9a96e", marginBottom: "10px" }}>
                <span>🏠 {t("statsSettlements")}: {player.settlements?.length || 0}</span>
                <span>🏙️ {t("statsCities")}: {player.cities?.length || 0}</span>
                <span>🛤️ {t("statsRoadsBuilt")}: {player.roads?.length || 0}</span>
                {(player.resorts?.length || 0) > 0 && <span>🏝️ {t("statsResorts")}: {player.resorts.length}</span>}
            </div>

            <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "0.7rem", color: "#a89572", marginBottom: "4px" }}>
                    {t("statsResourcesCollected")} ({totalResources})
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {Object.keys(RES_ICON).map((r) => (
                        <div key={r} title={t(RES_KEY[r])} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                            <img src={RES_ICON[r]} alt={t(RES_KEY[r])} style={{ width: "20px", height: "28px", objectFit: "cover", borderRadius: "3px" }} />
                            <span style={{ fontSize: "0.68rem", color: "#f2e6c9" }}>{resources[r] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "0.72rem", color: "#c9a96e" }}>
                <span>🤝 {t("statsBankTrades")}: {stats?.bankTrades?.[playerId] || 0}</span>
                <span>👥 {t("statsPlayerTrades")}: {stats?.playerTrades?.[playerId] || 0}</span>
                <span>🃏 {t("statsBought")}: {stats?.cardsBought?.[playerId] || 0}</span>
                <span>🎴 {t("statsPlayed")}: {stats?.cardsPlayed?.[playerId] || 0}</span>
                <span>🥷 {t("statsRobberMoves")}: {stats?.robberMoves?.[playerId] || 0}</span>
            </div>
        </div>
    );
}

export default function PostGameStats({ G, ctx, matchID, onBack, onClose }) {
    const { t } = useTranslation();
    const identities = usePlayerIdentities(matchID);
    const winnerId = ctx.gameover?.winner;
    const playerIds = Object.keys(G.players);

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 210,
                padding: "16px",
            }}
        >
            <div
                style={{
                    background: "#1c1208",
                    border: "3px solid #7a5320",
                    borderRadius: "14px",
                    padding: "22px 26px",
                    fontFamily: "Georgia, serif",
                    color: "#f2e6c9",
                    maxWidth: "720px",
                    width: "100%",
                    maxHeight: "88vh",
                    overflowY: "auto",
                    boxShadow: "0 10px 50px rgba(0,0,0,0.6)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "14px" }}>
                    <h2 style={{ margin: 0, color: "#f1d38a" }}>{t("statsTitle")}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            marginLeft: "auto",
                            background: "none",
                            border: "1px solid #7a5320",
                            borderRadius: "50%",
                            width: "30px",
                            height: "30px",
                            color: "#f2e6c9",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                        }}
                    >
                        ✕
                    </button>
                </div>

                <DiceHistogram diceRolls={G.stats?.diceRolls} t={t} />

                <h4 style={{ margin: "0 0 10px 0", color: "#c9a96e" }}>{t("statsPerPlayer")}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
                    {playerIds.map((pid) => (
                        <PlayerStatCard
                            key={pid}
                            playerId={pid}
                            player={G.players[pid]}
                            stats={G.stats}
                            identity={identities[pid]}
                            isWinner={String(pid) === String(winnerId)}
                            t={t}
                        />
                    ))}
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "8px" }}>
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={{
                                padding: "9px 18px",
                                borderRadius: "8px",
                                border: "2px solid #7a5320",
                                background: "rgba(255,255,255,0.08)",
                                color: "#f2e6c9",
                                fontWeight: "bold",
                                fontFamily: "Georgia, serif",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                            }}
                        >
                            {t("statsBackToVictory")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
