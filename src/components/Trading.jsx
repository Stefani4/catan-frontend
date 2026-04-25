import { useState } from "react";

export default function TradingPost({ G, ctx, moves, playerID }) {
  const otherPlayers = Object.keys(G.players).filter((id) => id !== playerID);

  const [bankTrade, setBankTrade] = useState({
    give: "lumber",
    receive: "brick",
  });

  const [p2pTrade, setP2PTrade] = useState({
    targetId: otherPlayers.length > 0 ? otherPlayers[0] : "",
    giveType: "lumber",
    giveAmount: 1,
    receiveType: "brick",
    receiveAmount: 1,
  });

  const player = G.players[playerID];
  const isMyTurn = String(ctx.currentPlayer) === String(playerID);

  if (G.activeOffer && String(G.activeOffer.to) === String(playerID)) {
    const offer = G.activeOffer;
    return (
      <div
        style={{
          padding: "15px",
          backgroundColor: "#e67e22",
          borderRadius: "10px",
          color: "white",
          border: "3px solid white",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Incoming Trade!</h3>
        <p>
          Player {offer.from} offers{" "}
          <b>
            {offer.give.amount} {offer.give.type}
          </b>
        </p>
        <p>
          for your{" "}
          <b>
            {offer.receive.amount} {offer.receive.type}
          </b>
        </p>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            onClick={() => moves.acceptTrade()}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: "#27ae60",
              color: "white",
              cursor: "pointer",
              border: "none",
              fontWeight: "bold",
            }}
          >
            Accept
          </button>
          <button
            onClick={() => moves.cancelTrade()}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: "#c0392b",
              color: "white",
              cursor: "pointer",
              border: "none",
              fontWeight: "bold",
            }}
          >
            Decline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "250px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <section
        style={{
          padding: "15px",
          backgroundColor: "#2c3e50",
          borderRadius: "10px",
          color: "white",
        }}
      >
        <h4 style={{ color: "#00d4ff", marginTop: 0 }}>Maritime Trade (4:1)</h4>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <select
            value={bankTrade.give}
            onChange={(e) =>
              setBankTrade({ ...bankTrade, give: e.target.value })
            }
          >
            {["brick", "lumber", "grain", "wool", "ore"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <span>➜</span>
          <select
            value={bankTrade.receive}
            onChange={(e) =>
              setBankTrade({ ...bankTrade, receive: e.target.value })
            }
          >
            {["brick", "lumber", "grain", "wool", "ore"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button
          disabled={
            !isMyTurn || !player || player.resources[bankTrade.give] < 4
          }
          onClick={() => moves.tradeWithBank(bankTrade)}
          style={{ width: "100%", padding: "5px", cursor: "pointer" }}
        >
          Trade with Bank
        </button>
      </section>

      <section
        style={{
          padding: "15px",
          backgroundColor: "#34495e",
          borderRadius: "10px",
          color: "white",
        }}
      >
        <h4 style={{ color: "#f1c40f", marginTop: 0 }}>Trade with Player</h4>

        <div style={{ fontSize: "0.8rem", marginBottom: "10px" }}>
          Target Player:
          <select
            value={p2pTrade.targetId}
            onChange={(e) =>
              setP2PTrade({ ...p2pTrade, targetId: e.target.value })
            }
            style={{ marginLeft: "5px" }}
          >
            {otherPlayers.map((id) => (
              <option key={id} value={id}>
                Player {id}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Give:</span>
            <input
              type="number"
              min="1"
              value={p2pTrade.giveAmount}
              onChange={(e) =>
                setP2PTrade({
                  ...p2pTrade,
                  giveAmount: parseInt(e.target.value) || 0,
                })
              }
              style={{ width: "40px" }}
            />
            <select
              value={p2pTrade.giveType}
              onChange={(e) =>
                setP2PTrade({ ...p2pTrade, giveType: e.target.value })
              }
            >
              {["brick", "lumber", "grain", "wool", "ore"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Get:</span>
            <input
              type="number"
              min="1"
              value={p2pTrade.receiveAmount}
              onChange={(e) =>
                setP2PTrade({
                  ...p2pTrade,
                  receiveAmount: parseInt(e.target.value) || 0,
                })
              }
              style={{ width: "40px" }}
            />
            <select
              value={p2pTrade.receiveType}
              onChange={(e) =>
                setP2PTrade({ ...p2pTrade, receiveType: e.target.value })
              }
            >
              {["brick", "lumber", "grain", "wool", "ore"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          disabled={
            !isMyTurn ||
            !player ||
            player.resources[p2pTrade.giveType] < p2pTrade.giveAmount ||
            G.activeOffer
          }
          onClick={() =>
            moves.offerTrade({
              targetPlayerId: p2pTrade.targetId,
              give: { type: p2pTrade.giveType, amount: p2pTrade.giveAmount },
              receive: {
                type: p2pTrade.receiveType,
                amount: p2pTrade.receiveAmount,
              },
            })
          }
          style={{
            width: "100%",
            padding: "8px",
            backgroundColor: "#f1c40f",
            border: "none",
            cursor: isMyTurn && !G.activeOffer ? "pointer" : "not-allowed",
            fontWeight: "bold",
            opacity: isMyTurn && !G.activeOffer ? 1 : 0.6,
          }}
        >
          {G.activeOffer ? "Offer Pending..." : "Send Offer"}
        </button>
      </section>
    </div>
  );
}
