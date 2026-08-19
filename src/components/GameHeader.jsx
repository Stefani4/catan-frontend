import { usePlayerIdentities } from "../hooks/usePlayerIdentities.js";

export default function GameHeader({ G, ctx, moves, playerID, matchID }) {
  const identities = usePlayerIdentities(matchID);
  const currentPlayerName = identities[String(ctx.currentPlayer)]?.name || `Player ${ctx.currentPlayer}`;
  const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];

  const getSeasonConfig = (season) => {
    switch (season) {
      case "Spring":
        return {
          icon: "🌱",
          name: "Spring",
          tagline: "Fertility",
          desc: "+1 Grain & Wool on rolls of 6 or 8",
          bg: "linear-gradient(135deg, #1a4a2e, #2ecc71)",
          border: "#2ecc71",
          badge: "#27ae60",
        };
      case "Summer":
        return {
          icon: "☀️",
          name: "Summer",
          tagline: "Harvest",
          desc: "Double production on rolls of 5 or 9",
          bg: "linear-gradient(135deg, #4a3800, #f1c40f)",
          border: "#f1c40f",
          badge: "#d4ac0d",
        };
      case "Autumn":
        return {
          icon: "🍂",
          name: "Autumn",
          tagline: "Abundance",
          desc: "Lumber & Brick also produce on rolls of 3 or 11",
          bg: "linear-gradient(135deg, #4a2000, #e67e22)",
          border: "#e67e22",
          badge: "#ca6f1e",
        };
      case "Winter":
        return {
          icon: "❄️",
          name: "Winter",
          tagline: "Hardship",
          desc: "Rolling 2 or 12 moves the Robber & strips a resource",
          bg: "linear-gradient(135deg, #0a1f3a, #3498db)",
          border: "#3498db",
          badge: "#2980b9",
        };
      default:
        return {
          icon: "🌍",
          name: season,
          tagline: "",
          desc: "",
          bg: "#1a1a1a",
          border: "#555",
          badge: "#555",
        };
    }
  };

  const getSetupInstruction = () => {
    const player = G.players[ctx.currentPlayer];
    if (!player || !player.settlements || !player.roads) return "Waiting...";
    if (player.settlements.length > player.roads.length) {
      return "Place a Road next to your settlement.";
    }
    return `Place Settlement #${player.settlements.length + 1}`;
  };

  const seasonsEnabled = G.settings?.seasonsEnabled !== false;
  const cfg = seasonsEnabled
      ? getSeasonConfig(G.season)
      : {
        icon: "🏝️",
        name: "Catan",
        tagline: "",
        desc: "",
        bg: "linear-gradient(135deg, #2c1e0e, #4a3210)",
        border: "#c9a96e",
        badge: "#c9a96e",
      };

  const turnsUntilChange = 5 - ((G.turnCount ?? 0) % 5);
  const nextSeason = SEASONS[(SEASONS.indexOf(G.season) + 1) % 4];

  return (

      <div style={{
        width: "100%",
        boxSizing: "border-box",
        borderRadius: "12px",
        overflow: "hidden",
        border: `2px solid ${cfg.border}`,
        fontFamily: "Georgia, serif",
      }}>

        <div style={{
          background: cfg.bg,
          padding: "10px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{cfg.icon}</span>
            <div style={{
              fontWeight: "bold",
              fontSize: "1rem",
              color: "white",
              textShadow: "1px 1px 4px rgba(0,0,0,0.6)",
              flex: 1,
              minWidth: 0,
            }}>
              {cfg.name}
            </div>
            {seasonsEnabled && ctx.phase !== "setup" && (
                <div
                    title={`${turnsUntilChange} ${turnsUntilChange === 1 ? "turn" : "turns"} until ${nextSeason}`}
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.7rem",
                      color: "#fff",
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "10px",
                      padding: "3px 8px",
                      border: "1px solid rgba(255,255,255,0.3)",
                      whiteSpace: "nowrap",
                    }}
                >
                  <span style={{ fontWeight: "bold" }}>{turnsUntilChange}</span>
                  <span style={{ opacity: 0.85 }}>{turnsUntilChange === 1 ? "turn" : "turns"} left</span>
                </div>
            )}
          </div>
          {seasonsEnabled && (
              <div style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.95)",
                fontStyle: "italic",
                marginTop: "4px",
                lineHeight: 1.35,
              }}>
                <strong style={{ fontStyle: "normal" }}>{cfg.tagline}</strong>
                {cfg.tagline && " — "}{cfg.desc}
              </div>
          )}
        </div>

        <div style={{
          background: "linear-gradient(135deg, #1c1208, #2c1e0e)",
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${cfg.border}55`,
        }}>

          <div>
            <div style={{ color: cfg.border, fontWeight: "bold", fontSize: "0.75rem", textTransform: "uppercase" }}>
              {ctx.phase}
            </div>
            <div style={{ color: "#c9a96e", fontSize: "0.8rem" }}>
              ⚔️ {currentPlayerName}
            </div>
          </div>

          {ctx.phase === "setup" && (
              <span style={{ color: "#ffc107", fontSize: "0.75rem", fontStyle: "italic", textAlign: "right" }}>
            {getSetupInstruction()}
          </span>
          )}
        </div>
      </div>
  );
}
