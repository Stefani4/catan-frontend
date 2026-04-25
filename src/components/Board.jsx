import GameHeader from "./GameHeader.jsx";
import PlayerStats from "./PlayerStats.jsx";
import TradingPost from "./Trading.jsx";
import GameBoard from "./GameBoard.jsx";
import TurnTimer from "./TurnTimer.jsx";
import { useState, useEffect } from "react";

export default function Board({ G, ctx, moves, events, playerID }) {
  const [notification, setNotification] = useState("");

  useEffect(() => {
    if (G.lastTradeStatus === "success") {
      const showTimer = setTimeout(() => {
        setNotification("Trade Successful!");
      }, 0);

      const hideTimer = setTimeout(() => {
        setNotification("");

        if (moves.clearTradeStatus) {
          moves.clearTradeStatus();
        }
      }, 3000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [G.lastTradeStatus, moves]);

  if (!G || !G.players || !G.players[ctx.currentPlayer]) {
    return <div>Loading player data...</div>;
  }

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        display: "flex",
        gap: "40px",
      }}
    >
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#27ae60",
            color: "white",
            padding: "12px 25px",
            borderRadius: "8px",
            zIndex: 9999,
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            fontWeight: "bold",
            border: "2px solid white",
          }}
        >
          {notification}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <GameHeader
          G={G}
          ctx={ctx}
          moves={moves}
          events={events}
          playerID={playerID}
        />

        <GameBoard G={G} ctx={ctx} moves={moves} playerID={playerID} />

        {ctx.phase !== "setup" && (
          <div style={{ marginTop: "16px" }}>
            <TurnTimer
              key={`${ctx.currentPlayer}-${G.diceRolled}`}
              G={G}
              ctx={ctx}
              moves={moves}
            />

            {G.diceRolled &&
              (playerID === undefined || ctx.currentPlayer === playerID) && (
                <button
                  onClick={() => moves.endTurn()}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "10px",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                  }}
                >
                  ⏩ End Turn Now
                </button>
              )}
          </div>
        )}
      </div>

      <div className="sidebar" style={{ minWidth: "300px" }}>
        <PlayerStats G={G} ctx={ctx} />
        <TradingPost G={G} ctx={ctx} moves={moves} playerID={playerID} />
      </div>
    </div>
  );
}
