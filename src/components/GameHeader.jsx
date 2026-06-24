export default function GameHeader({ G, ctx, moves, playerID }) {
  const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];

  const getSeasonConfig = (season) => {
    switch (season) {
      case "Spring":
        return {
          icon: "🌱",
          label: "Spring — Fertility",
          desc: "+1 Grain & Wool on rolls of 6 or 8",
          bg: "linear-gradient(135deg, #1a4a2e, #2ecc71)",
          border: "#2ecc71",
          badge: "#27ae60",
        };
      case "Summer":
        return {
          icon: "☀️",
          label: "Summer — Harvest",
          desc: "Double production on rolls of 5 or 9",
          bg: "linear-gradient(135deg, #4a3800, #f1c40f)",
          border: "#f1c40f",
          badge: "#d4ac0d",
        };
      case "Autumn":
        return {
          icon: "🍂",
          label: "Autumn — Abundance",
          desc: "Lumber & Brick also produce on rolls of 3 or 11",
          bg: "linear-gradient(135deg, #4a2000, #e67e22)",
          border: "#e67e22",
          badge: "#ca6f1e",
        };
      case "Winter":
        return {
          icon: "❄️",
          label: "Winter — Hardship",
          desc: "Rolling 2 or 12 moves the Robber & strips a resource",
          bg: "linear-gradient(135deg, #0a1f3a, #3498db)",
          border: "#3498db",
          badge: "#2980b9",
        };
      default:
        return {
          icon: "🌍",
          label: season,
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

  const cfg = getSeasonConfig(G.season);

  const turnsUntilChange = 5 - ((G.turnCount ?? 0) % 5);
  const nextSeason = SEASONS[(SEASONS.indexOf(G.season) + 1) % 4];

 return (
    
    <div style={{
      borderRadius: "12px",
      overflow: "hidden",
      border: `2px solid ${cfg.border}`,
      fontFamily: "Georgia, serif",

      // flexShrink: 0, // added for side bar
      // minHeight: "120px" // added for sidebar 
    }}>
      {/* Season strip */}
      <div style={{
        background: cfg.bg,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <span style={{ fontSize: "1.6rem" }}>{cfg.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold", fontSize: "1rem", color: "white", textShadow: "1px 1px 4px rgba(0,0,0,0.6)" }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", fontStyle: "italic" }}>
            {cfg.desc}
          </div>
        </div>
        {ctx.phase !== "setup" && (
          <div style={{ textAlign: "right", fontSize: "0.7rem", color: "rgba(255,255,255,0.8)" }}>
            <div>{turnsUntilChange} {turnsUntilChange === 1 ? "turn" : "turns"}</div>
            <div>→ {nextSeason}</div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        background: "linear-gradient(135deg, #1c1208, #2c1e0e)",
        padding: "10px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${cfg.border}55`,
      }}>
        {/* Phase + player */}
        <div>
          <div style={{ color: cfg.border, fontWeight: "bold", fontSize: "0.75rem", textTransform: "uppercase" }}>
            {ctx.phase}
          </div>
          <div style={{ color: "#c9a96e", fontSize: "0.8rem" }}>
            ⚔️ Player {ctx.currentPlayer}
          </div>
        </div>

        {/* Last roll */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", color: "#888", textTransform: "uppercase" }}>Last Roll</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ffd700", lineHeight: 1 }}>
            {G.diceValue || "—"}
          </div>
        </div>

        {/* Roll / setup */}
        <div>
          {ctx.phase === "setup" ? (
            <span style={{ color: "#ffc107", fontSize: "0.75rem", fontStyle: "italic" }}>
              {getSetupInstruction()}
            </span>
          ) : (
            <button
              disabled={G.diceRolled || (playerID !== undefined && ctx.currentPlayer !== playerID)}
              onClick={() => moves.rollDice()}
              style={{
                padding: "8px 14px",
                fontWeight: "bold",
                fontSize: "0.85rem",
                cursor: G.diceRolled ? "not-allowed" : "pointer",
                backgroundColor: G.diceRolled ? "#333" : cfg.badge,
                color: "white",
                border: `2px solid ${G.diceRolled ? "#555" : cfg.border}`,
                borderRadius: "8px",
                opacity: G.diceRolled ? 0.5 : 1,
                fontFamily: "Georgia, serif",
              }}
            >
              🎲 Roll
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
