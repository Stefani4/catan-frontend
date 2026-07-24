import { getPlayerColor } from "../constants/playerColors.js";

// Shown once boardgame.io's ctx.gameover is set (see CatanGame.js `endIf`,
// which fires as soon as a player's victoryPoints reach VICTORY_POINTS_TO_WIN).
// At that point boardgame.io stops accepting further moves on its own, so
// this is purely a "tell the players what happened" screen.
export default function VictoryModal({ G, ctx, playerID, onLeave }) {
  const winnerId = ctx.gameover?.winner;
  if (winnerId === undefined || winnerId === null) return null;

  const winner = G.players?.[winnerId];
  const color = getPlayerColor(winnerId);
  const isMe = playerID !== undefined && playerID !== null && String(playerID) === String(winnerId);

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
          {isMe ? "You win!" : `${color.name} wins!`}
        </h1>
        <p style={{ margin: "0 0 18px 0", fontSize: "0.95rem", color: "#5a4326" }}>
          {`Player ${winnerId} reached ${winner?.victoryPoints ?? 10} Victory Points.`}
        </p>
        {onLeave && (
          <button
            onClick={onLeave}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              background: color.accent,
              color: "white",
              fontWeight: "bold",
              fontFamily: "Georgia, serif",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Back to Menu
          </button>
        )}
      </div>
    </div>
  );
}
