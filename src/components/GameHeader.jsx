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
    <div
      style={{
        marginBottom: "20px",
        borderRadius: "14px",
        overflow: "hidden",
        border: `2px solid ${cfg.border}`,
        boxShadow: `0 0 18px ${cfg.border}55`,
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          background: cfg.bg,
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "2rem" }}>{cfg.icon}</span>
          <div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                letterSpacing: "0.5px",
              }}
            >
              {cfg.label}
            </div>
            <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>{cfg.desc}</div>
          </div>
        </div>

        {ctx.phase !== "setup" && (
          <div
            style={{
              textAlign: "right",
              background: "rgba(0,0,0,0.35)",
              borderRadius: "8px",
              padding: "6px 12px",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                opacity: 0.75,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Next season in
            </div>
            <div
              style={{ fontSize: "1.4rem", fontWeight: "bold", lineHeight: 1 }}
            >
              {turnsUntilChange} {turnsUntilChange === 1 ? "turn" : "turns"}
            </div>
            <div style={{ fontSize: "0.7rem", opacity: 0.75 }}>
              → {nextSeason}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: "#1a1a1a",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              color: "#00d4ff",
              fontWeight: "bold",
              fontSize: "1rem",
              textTransform: "uppercase",
            }}
          >
            {ctx.phase}
          </div>
          <div style={{ color: "#aaa", fontSize: "0.85rem", marginTop: "2px" }}>
            Player {ctx.currentPlayer}'s turn
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "0.65rem",
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Last Roll
          </div>
          <div
            style={{
              fontSize: "2.8rem",
              fontWeight: "bold",
              color: "#ffd700",
              lineHeight: 1,
            }}
          >
            {G.diceValue || "--"}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          {ctx.phase === "setup" ? (
            <span style={{ color: "#ffc107", fontSize: "0.9rem" }}>
              {getSetupInstruction()}
            </span>
          ) : (
            <button
              disabled={
                G.diceRolled ||
                (playerID !== undefined && ctx.currentPlayer !== playerID)
              }
              onClick={() => moves.rollDice()}
              style={{
                padding: "10px 22px",
                fontWeight: "bold",
                fontSize: "0.95rem",
                cursor: G.diceRolled ? "not-allowed" : "pointer",
                backgroundColor: G.diceRolled ? "#444" : cfg.badge,
                color: "white",
                border: "none",
                borderRadius: "8px",
                opacity: G.diceRolled ? 0.5 : 1,
                transition: "all 0.2s",
              }}
            >
              🎲 ROLL DICE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
