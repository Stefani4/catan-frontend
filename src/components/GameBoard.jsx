import Hex from "./Hex.jsx";
import { BuildingSpot, RoadSpot } from "./GamePieces.jsx";
import HarborMarker from "./HarborMarker.jsx";
import {
  isDistanceRuleMet,
  isIntersectionConnectedToPlayerRoad,
} from "../../game/moves.js";

const RESORT_COST = { ore: 3, lumber: 4, wool: 2, brick: 1 };

function canAffordResort(player) {
  if (!player) return false;
  return Object.entries(RESORT_COST).every(
    ([res, amt]) => (player.resources?.[res] ?? 0) >= amt,
  );
}

export default function GameBoard({
                                    G,
                                    ctx,
                                    moves,
                                    playerID,
                                    pendingCardAction,
                                    setPendingCardAction,
                                  }) {
  const handleIntersectionClick = (id) => {
    moves.buildSettlement(id);
  };

  const isRoadBuildingActive = pendingCardAction?.type === "roadBuilding";

  const handleRoadClick = (id) => {
    if (isRoadBuildingActive) {
      const picks = pendingCardAction.picks || [];
      if (picks.includes(id)) return;

      const nextPicks = [...picks, id];
      if (nextPicks.length >= 2) {
        moves.playRoadBuilding(nextPicks);
        setPendingCardAction(null);
      } else {
        setPendingCardAction({ ...pendingCardAction, picks: nextPicks });
      }
      return;
    }

    moves.buildRoad(id);
  };

  if (!G?.board?.edges || !G?.board?.intersections || !G?.board?.hexes) {
    return null;
  }

  const { hexes, intersections, edges, layout } = G.board;
  const hexWidth = layout?.hexWidth ?? 99;
  const hexHeight = layout?.hexHeight ?? 114;
  const width = layout?.width ?? 550;
  const height = layout?.height ?? 513;

  const viewingPlayerId = String(
      playerID !== undefined ? playerID : ctx.currentPlayer,
  );
  const isMyTurn = String(ctx.currentPlayer) === viewingPlayerId;
  const canShowLegalSpots =
      isMyTurn &&
      !G.isRobberPlacing &&
      !pendingCardAction &&
      (ctx.phase === "setup" || ctx.phase === "main");

  const legalSettlementSpots = new Set();
  const legalResortSpots = new Set();
  if (canShowLegalSpots) {
    Object.keys(intersections).forEach((id) => {
      const isOccupied = Object.values(G.players).some((p) =>
          [...p.settlements, ...p.cities, ...(p.resorts || [])].some(
              (b) => b.id === id,
          ),
      );
      if (isOccupied) return;
      if (!isDistanceRuleMet(G, id)) return;
      if (
          ctx.phase !== "setup" &&
          !isIntersectionConnectedToPlayerRoad(G, ctx.currentPlayer, id)
      )
        return;
      legalSettlementSpots.add(id);
    });

    if (ctx.phase !== "setup" && canAffordResort(G.players[viewingPlayerId])) {
      Object.entries(G.players).forEach(([pid, p]) => {
        if (pid === viewingPlayerId) return;
        (p.cities || []).forEach((c) => legalResortSpots.add(c.id));
      });
    }
  }

  return (
      <div style={{ position: "relative", width: `${width}px`, height: `${height}px` }}>
        {hexes.map((hex) => (
            <Hex key={hex.id} hex={hex} G={G} moves={moves} width={hexWidth} height={hexHeight} />
        ))}

        {Object.values(intersections).map((vertex) => (
            <BuildingSpot
                key={vertex.id}
                id={vertex.id}
                G={G}
                ctx={ctx}
                moves={moves}
                isLegalSpot={legalSettlementSpots.has(vertex.id)}
                isLegalResortTarget={legalResortSpots.has(vertex.id)}
                style={{ left: `${vertex.x}px`, top: `${vertex.y}px` }}
                onClick={handleIntersectionClick}
            />
        ))}

        {Object.values(edges).map((edge) => {
          const [aId, bId] = edge.endpoints;
          const a = intersections[aId];
          const b = intersections[bId];
          if (!a || !b) return null;

          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const length = Math.hypot(dx, dy);
          const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
          const isPicked =
              isRoadBuildingActive && (pendingCardAction.picks || []).includes(edge.id);

          return (
              <RoadSpot
                  key={edge.id}
                  id={edge.id}
                  G={G}
                  ctx={ctx}
                  rotation={rotation}
                  length={length}
                  style={{
                    left: `${midX}px`,
                    top: `${midY}px`,
                    ...(isPicked
                        ? { outline: "3px solid #ffd700", borderRadius: "4px" }
                        : {}),
                  }}
                  onClick={handleRoadClick}
              />
          );
        })}

        {(G.board.harbors || []).map((harbor) => (
            <HarborMarker key={harbor.id} harbor={harbor} />
        ))}
      </div>
  );
}
