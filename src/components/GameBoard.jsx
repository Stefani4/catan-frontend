import Hex from "./Hex.jsx";
import { BuildingSpot, RoadSpot } from "./GamePieces.jsx";

const ROW_CONFIG = [3, 4, 5, 4, 3];
const ROW_OFFSETS = [1, 0.5, 0, 0.5, 1];

const HEX_VISUAL_COL = {};
let _idx = 0;

ROW_CONFIG.forEach((count, row) => {
  for (let col = 0; col < count; col++) {
    HEX_VISUAL_COL[`hex_${_idx++}`] = col + ROW_OFFSETS[row];
  }
});

function edgeId(a, b) {
  return [a, b].sort().join("--");
}

function classifyAdjacentEdges(intId, hexId, board) {
  const internalId = edgeId(`int_${hexId}_top`, `int_${hexId}_bottom`);
  const vcN = HEX_VISUAL_COL[hexId] ?? 0;
  let left = null,
    right = null;

  (board.intersections[intId]?.adjacentEdges ?? []).forEach((eId) => {
    if (eId === internalId) return;
    const edge = board.edges[eId];
    if (!edge) return;
    const otherInt = edge.endpoints.find((e) => e !== intId);
    const hexMatch = otherInt?.match(/int_(hex_\d+)_/);
    if (!hexMatch) return;
    const vcOther = HEX_VISUAL_COL[hexMatch[1]] ?? 0;
    if (vcOther > vcN) right = eId;
    else left = eId;
  });

  return { left, right };
}

export default function GameBoard({ G, ctx, moves }) {
  let hexCount = 0;

  const handleIntersectionClick = (id) => {
    console.log("Clicked Intersection:", id);
    moves.buildSettlement(id);
  };

  const handleRoadClick = (id) => {
    moves.buildRoad(id);
  };

  if (!G?.board?.edges || !G?.board?.intersections) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "fit-content",
      }}
    >
      {ROW_CONFIG.map((count, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "-28px",
          }}
        >
          {Array.from({ length: count }).map(() => {
            const hex = G.board.hexes[hexCount++];
            if (!hex) return null;
            const hId = hex.id;
            const topInt = `int_${hId}_top`;
            const botInt = `int_${hId}_bottom`;

            const internalId = edgeId(topInt, botInt);

            const { left: upperLeftId, right: upperRightId } =
              classifyAdjacentEdges(topInt, hId, G.board);

            return (
              <Hex key={hId} hex={hex} G={G} moves={moves}>
                <BuildingSpot
                  id={topInt}
                  G={G}
                  ctx={ctx}
                  moves={moves}
                  style={{ top: "0%", left: "50%" }}
                  onClick={handleIntersectionClick}
                />
                <BuildingSpot
                  id={botInt}
                  G={G}
                  ctx={ctx}
                  moves={moves}
                  style={{ top: "100%", left: "50%" }}
                  onClick={handleIntersectionClick}
                />

                <RoadSpot
                  id={internalId}
                  G={G}
                  ctx={ctx}
                  rotation={90}
                  style={{ top: "50%", left: "100%" }}
                  onClick={handleRoadClick}
                />

                {upperRightId && (
                  <RoadSpot
                    id={upperRightId}
                    G={G}
                    ctx={ctx}
                    rotation={30}
                    style={{ top: "12.5%", left: "75%" }}
                    onClick={handleRoadClick}
                  />
                )}

                {upperLeftId && (
                  <RoadSpot
                    id={upperLeftId}
                    G={G}
                    ctx={ctx}
                    rotation={150}
                    style={{ top: "12.5%", left: "25%" }}
                    onClick={handleRoadClick}
                  />
                )}
              </Hex>
            );
          })}
        </div>
      ))}
    </div>
  );
}
