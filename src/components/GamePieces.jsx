export const BuildingSpot = ({ id, G, ctx, moves, onClick, style }) => {
  if (!G || !G.players || !G.board.intersections[id]) return null;

  const ownerId = Object.keys(G.players).find(
    (pid) =>
      G.players[pid].settlements?.some((s) => s.id === id) ||
      G.players[pid].cities?.some((c) => c.id === id),
  );

  const isCity = ownerId && G.players[ownerId].cities?.some((c) => c.id === id);
  const playerColors = ["#f00", "#00f", "#fff", "#ffa500"];

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

    if (ownerId === ctx.currentPlayer && !isCity && ctx.phase !== "setup") {
      moves.buildCity(id);
    } else if (!ownerId) {
      onClick(id);
    }
  };

  return (
    <div
      onClick={handleSpotClick}
      style={{
        position: "absolute",
        width: isCity ? "26px" : "20px",
        height: isCity ? "26px" : "20px",
        backgroundColor: ownerId
          ? playerColors[parseInt(ownerId)]
          : "rgba(255, 255, 255, 0.4)",
        border: ownerId ? "2px solid black" : "1px dashed #666",
        borderRadius: isCity ? "2px" : "50%",
        cursor: "pointer",
        zIndex: 100,
        transform: "translate(-50%, -50%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {ownerId && (
        <span
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            color: ownerId === "2" ? "black" : "white",
          }}
        >
          {isCity ? "C" : "H"}
        </span>
      )}
    </div>
  );
};

export const RoadSpot = ({ id, G, ctx, onClick, style, rotation }) => {
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

  const playerColors = ["#f00", "#00f", "#fff", "#ffa500"];

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
        width: "40px",
        height: ownerId ? "10px" : "7px",
        backgroundColor: ownerId
          ? playerColors[parseInt(ownerId)]
          : "rgba(255, 255, 255, 0.6)",
        borderRadius: "4px",
        cursor: "pointer",
        zIndex: 15,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        border: ownerId ? "1px solid black" : "2px dashed #222",
        ...style,
      }}
    />
  );
};
