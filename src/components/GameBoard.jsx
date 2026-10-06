import Hex from "./Hex.jsx";
import { BuildingSpot, RoadSpot } from "./GamePieces.jsx";
import HarborMarker from "./HarborMarker.jsx";
import {
  isDistanceRuleMet,
  isIntersectionConnectedToPlayerRoad,
  isConnectedToPlayer,
  isEdgeAdjacentToIntersection,
  hasEnoughResources,
  BUILD_COSTS,
  MAX_ROADS,
} from "../../game/moves.js";
import { usePlayerIdentities } from "../hooks/usePlayerIdentities.js";
import { isEdgeSubmerged, isIntersectionSubmerged } from "../../game/flood.js";
import { getColorByIndex } from "../constants/playerColors.js";

function useBoardIdentities(matchID) {
  const identities = usePlayerIdentities(matchID);
  const colorIndexById = {};
  const skinById = {};
  Object.entries(identities).forEach(([pid, identity]) => {
    colorIndexById[pid] = identity.colorIndex;
    if (identity.pieceSkinId) skinById[pid] = identity.pieceSkinId;
  });
  return { colorIndexById, skinById };
}

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
                                    matchID,
                                    pendingCardAction,
                                    setPendingCardAction,
                                    hexFilter,
                                    highlightHexId,
                                  }) {
  const { colorIndexById, skinById } = useBoardIdentities(matchID);

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
      if (isIntersectionSubmerged(G, id)) return;
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

  const legalRoadSpots = new Set();
  if (canShowLegalSpots) {
    const player = G.players[viewingPlayerId];
    const canStillPlaceRoad =
        player &&
        (ctx.phase === "setup"
            ? player.roads.length < 2 && player.roads.length < player.settlements.length
            : player.roads.length < MAX_ROADS && hasEnoughResources(player, BUILD_COSTS.road));

    if (canStillPlaceRoad) {
      Object.keys(edges).forEach((id) => {
        const isEdgeAlreadyClaimed = Object.values(G.players).some((p) =>
            p.roads.some((r) => r.id === id),
        );
        if (isEdgeAlreadyClaimed) return;
        if (isEdgeSubmerged(G, id)) return;

        if (ctx.phase === "setup") {
          const lastSettlement = player.settlements[player.settlements.length - 1];
          if (!lastSettlement || !isEdgeAdjacentToIntersection(G, id, lastSettlement.id))
            return;
        } else if (!isConnectedToPlayer(G, viewingPlayerId, id)) {
          return;
        }

        legalRoadSpots.add(id);
      });
    }
  }

  const claims = G.draft?.claims || {};
  const pending = new Set(G.flood?.pending || []);
  const claimColor = (hexId) => {
    const owner = claims[hexId];
    if (owner === undefined) return undefined;
    const idx = Number.isInteger(colorIndexById[owner]) ? colorIndexById[owner] : parseInt(owner, 10) % 9;
    return getColorByIndex(idx).soft;
  };

  return (
      <div style={{ position: "relative", width: `${width}px`, height: `${height}px` }}>
        {hexes.map((hex) => (
            <Hex
                key={hex.id}
                hex={hex}
                G={G}
                moves={moves}
                width={hexWidth}
                height={hexHeight}
                hexFilter={hexFilter}
                claimColor={claimColor(hex.id)}
                highlighted={highlightHexId === hex.id}
                pending={pending.has(hex.id)}
            />
        ))}

        {Object.values(intersections).map((vertex) => (
            <BuildingSpot
                key={vertex.id}
                id={vertex.id}
                G={G}
                ctx={ctx}
                moves={moves}
                colorIndexById={colorIndexById}
                skinById={skinById}
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
                  colorIndexById={colorIndexById}
                  skinById={skinById}
                  rotation={rotation}
                  length={length}
                  isLegalSpot={legalRoadSpots.has(edge.id)}
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