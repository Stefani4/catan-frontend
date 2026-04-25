export default function PlayerStats({ G, ctx }) {
  return (
    <div style={{ padding: "20px", color: "#333" }}>
      <h2 style={{ color: "#fff" }}>Players</h2>
      {Object.entries(G.players).map(([playerId, player]) => (
        <div
          key={playerId}
          style={{
            marginBottom: "15px",
            padding: "15px",
            backgroundColor: "#f9f9f9",
            border:
              ctx.currentPlayer === playerId
                ? "3px solid #ffd700"
                : "1px solid #ccc",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            color: "#222",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>Player {playerId}</h3>
          <p style={{ fontWeight: "bold" }}>VP: {player.victoryPoints}</p>
          <hr />
          <p style={{ margin: "5px 0", textDecoration: "underline" }}>
            Resources:
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {["brick", "lumber", "grain", "wool", "ore"].map((resKey) => {
              const amount = player.resources[resKey] || 0;
              return (
                <li
                  key={resKey}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "2px 0",
                  }}
                >
                  <span style={{ textTransform: "capitalize" }}>{resKey}:</span>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: amount > 0 ? "#2e7d32" : "#999",
                    }}
                  >
                    {amount}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
