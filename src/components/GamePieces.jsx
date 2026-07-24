import cyanS from "../../images/cyanS.png";
import dblueS from "../../images/dblueS.png";
import greenS from "../../images/greenS.png";
import orangeS from "../../images/orangeS.png";
import pinkS from "../../images/pinkS.png";
import lavanderS from "../../images/lavanderS.png";
import purpleS from "../../images/purpleS.png";
import redS from "../../images/redS.png";
import yellowS from "../../images/yellowS.png";

import cyanR from "../../images/cyanR.png";
import dblueR from "../../images/dblueR.png";
import greenR from "../../images/greenR.png";
import orangeR from "../../images/orangeR.png";
import pinkR from "../../images/pinkR.png";
import lavanderR from "../../images/lavanderR.png";
import purpleR from "../../images/purpleR.png";
import redR from "../../images/redR.png";
import yellowR from "../../images/yellowR.png";

import cyanC from "../../images/cyanC.png";
import dblueC from "../../images/dblueC.png";
import greenC from "../../images/greenC.png";
import orangeC from "../../images/orangeC.png";
import pinkC from "../../images/pinkC.png";
import lavanderC from "../../images/lavanderC.png";
import purpleC from "../../images/purpleC.png";
import redC from "../../images/redC.png";
import yellowC from "../../images/yellowC.png";

const settlementImages = {
  0: redS,
  1: dblueS,
  2: greenS,
  3: orangeS,
  4: yellowS,
  5: purpleS,
  6: pinkS,
  7: cyanS,
  8: lavanderS,
};

const cityImages = {
  0: redC,
  1: dblueC,
  2: greenC,
  3: orangeC,
  4: yellowC,
  5: purpleC,
  6: pinkC,
  7: cyanC,
  8: lavanderC,
};

const roadImages = {
  0: redR,
  1: dblueR,
  2: greenR,
  3: orangeR,
  4: yellowR,
  5: purpleR,
  6: pinkR,
  7: cyanR,
  8: lavanderR,
};

export const BuildingSpot = ({ id, G, ctx, moves, onClick, style, isLegalSpot, isLegalResortTarget }) => {
  if (!G || !G.players || !G.board.intersections[id]) return null;

  const ownerId = Object.keys(G.players).find(
      (pid) =>
          G.players[pid].settlements?.some((s) => s.id === id) ||
          G.players[pid].cities?.some((c) => c.id === id) ||
          G.players[pid].resorts?.some((r) => r.id === id),
  );

  const isCity = ownerId && G.players[ownerId].cities?.some((c) => c.id === id);
  const isResort = ownerId && G.players[ownerId].resorts?.some((r) => r.id === id);
  const PLAYER_COLORS = ["#f00", "#00f", "#fff", "#ffa500"];

  const handleSpotClick = (e) => {
    e.stopPropagation();

    const currentPlayerId = String(
        ctx.playerID !== undefined ? ctx.playerID : ctx.currentPlayer,
    );
    const activePlayerId = String(ctx.currentPlayer);

    if (currentPlayerId !== activePlayerId) {
      console.warn(`Not your turn! Current: ${activePlayerId}`);
      return;
    }

    if (!ownerId) {
      onClick(id);
    } else if (ownerId === ctx.currentPlayer && !isCity && !isResort && ctx.phase !== "setup") {
      moves.buildCity(id);
    } else if (ownerId !== ctx.currentPlayer && isCity && !isResort && ctx.phase !== "setup") {
      moves.buildResort(id);
    }
  };

  return (
      <div
          onClick={handleSpotClick}
          title={
            isResort
                ? "Resort — cannot be taken over"
                : isLegalResortTarget
                    ? "Click to seize this city and build a Resort"
                    : isLegalSpot
                        ? "Legal settlement spot"
                        : undefined
          }
          style={{
            position: "absolute",
            width: isCity || isResort ? "36px" : "28px",
            height: isCity || isResort ? "36px" : "28px",
            cursor: "pointer",
            zIndex: 100,
            transform: "translate(-50%, -50%)",
            ...style,
          }}
      >
        {ownerId ? (
            <div
                className={isLegalResortTarget ? "resort-target-pulse" : ""}
                style={{ position: "relative", width: "100%", height: "100%" }}
            >
              <img
                  src={
                    isCity || isResort
                        ? cityImages[parseInt(ownerId)]
                        : settlementImages[parseInt(ownerId)]
                  }
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              {isResort && (
                  <span
                      title="Resort"
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-8px",
                        fontSize: "0.9rem",
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                      }}
                  >
                🏖️
              </span>
              )}
            </div>
        ) : (
            <div
                className={isLegalSpot ? "legal-spot-pulse" : ""}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: isLegalSpot
                      ? "rgba(46, 204, 113, 0.55)"
                      : "rgba(255,255,255,0.35)",
                  border: isLegalSpot ? "2px solid #2ecc71" : "1px dashed #666",
                  boxShadow: isLegalSpot ? "0 0 10px 3px rgba(46, 204, 113, 0.7)" : "none",
                }}
            />
        )}
      </div>
  );
};

export const RoadSpot = ({ id, G, ctx, onClick, style, rotation, length = 50 }) => {
  if (!G || !G.players || !G.board.edges || !G.board.edges[id]) return null;

  const edgeEntry =
      G.board.edges[id] ||
      Object.values(G.board.edges).find(
          (e) =>
              e.endpoints + "--" + e.endpoints === id ||
              e.endpoints + "--" + e.endpoints === id,
      );

  if (!edgeEntry) return null;

  const actualId = edgeEntry.id;

  const ownerId = Object.keys(G.players).find(
      (playerId) =>
          G.players[playerId].roads &&
          G.players[playerId].roads.some((r) => r.id === actualId),
  );

  const PLAYER_COLORS = ["#f00", "#00f", "#fff", "#ffa500"];

  const handleRoadClick = (e) => {
    e.stopPropagation();
    const currentPlayerId = String(
        ctx.playerID !== undefined ? ctx.playerID : ctx.currentPlayer,
    );
    if (currentPlayerId !== String(ctx.currentPlayer)) return;
    onClick(actualId);
  };

  return (
      <div
          onClick={handleRoadClick}
          style={{
            position: "absolute",
            width: `${length}px`,
            height: "30px",
            cursor: "pointer",
            zIndex: 15,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            ...style,
          }}
      >
        {ownerId ? (
            <img
                src={roadImages[parseInt(ownerId)]}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                  paddingTop: "9px",
                  paddingBottom: "9px",
                  boxSizing: "border-box",
                }}
            />
        ) : (
            <div
                style={{
                  width: "100%",
                  height: "7px",
                  marginTop: "6px",
                  backgroundColor: "rgba(255,255,255,0.6)",
                  borderRadius: "4px",
                  border: "2px dashed #222",
                }}
            />
        )}
      </div>
  );
};
