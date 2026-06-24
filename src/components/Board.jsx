import GameHeader from "./GameHeader.jsx";
import PlayerStats from "./PlayerStats.jsx";
import TradingPost from "./Trading.jsx";
import GameBoard from "./GameBoard.jsx";
import TurnTimer from "./TurnTimer.jsx";
import { useState, useEffect } from "react";
import springBg from "../../images/springB.png";
import summerBg from "../../images/summerB.png";
import autumnBg from "../../images/autumnB.png";
import winterBg from "../../images/winterB.png";

// lookup map 
const seasonBackgrounds = {
  Spring: springBg,
  Summer: summerBg,
  Autumn: autumnBg,
  Winter: winterBg,
};

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
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      backgroundImage: `url(${seasonBackgrounds[G.season]})`,
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "#000",
      position: "fixed",
      top: 0,
      left: 0,
    }}
  >
    {/* Trade notification */}
    {notification && (
      <div style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#27ae60",
        color: "white",
        padding: "12px 25px",
        borderRadius: "8px",
        zIndex: 9999,
        fontWeight: "bold",
        border: "2px solid white",
      }}>
        {notification}
      </div>
    )}


    {/* Board centered in the middle */}
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 10,
    }}>
      <GameBoard G={G} ctx={ctx} moves={moves} playerID={playerID} />
    </div>

    {/* Sidebar on the right */}
    <div style={{
      position: "absolute",
      top: "50px",
      right: "20px",
      zIndex: 20,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      maxHeight: "90vh",
      // overflowY: "auto",
      // width: "300px",
      alignItems: "stretch"
    }}>
      <GameHeader G={G} ctx={ctx} moves={moves} playerID={playerID} />
      <PlayerStats G={G} ctx={ctx} />
      <TradingPost G={G} ctx={ctx} moves={moves} playerID={playerID} />
      {ctx.phase !== "setup" && (
        <>
          <TurnTimer key={`${ctx.currentPlayer}-${G.diceRolled}`} G={G} ctx={ctx} moves={moves} />
          {G.diceRolled && (playerID === undefined || ctx.currentPlayer === playerID) && (
            <button
              onClick={() => moves.endTurn()}
              style={{
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
        </>
      )}
      
    </div>
  </div>
);


}
