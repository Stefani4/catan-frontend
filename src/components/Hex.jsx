const Robber = () => (
  <div
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <div
      style={{
        width: "12px",
        height: "12px",
        backgroundColor: "#333",
        borderRadius: "50%",
        border: "1px solid white",
      }}
    />
    <div
      style={{
        width: "18px",
        height: "20px",
        backgroundColor: "#333",
        borderRadius: "40% 40% 10% 10%",
        marginTop: "-4px",
        border: "1px solid white",
      }}
    />
    <div
      style={{
        width: "24px",
        height: "6px",
        backgroundColor: "#222",
        borderRadius: "4px",
        marginTop: "-2px",
        border: "1px solid white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
      }}
    />
  </div>
);

export default function Hex({ hex, G, moves, children }) {
  const colors = {
    hills: "#a0522d",
    forest: "#228b22",
    fields: "#ffd700",
    pasture: "#7cfc00",
    mountains: "#808080",
    desert: "#f4a460",
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100px",
        height: "110px",
        margin: "0 2px",
      }}
    >
      <div
        style={{
          width: "100px",
          height: "110px",
          backgroundColor: colors[hex.terrain] || "#ccc",
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontWeight: "bold",
            fontSize: "0.8rem",
            color: "white",
            textShadow: "1px 1px 2px black",
          }}
        >
          {hex.terrain}
        </span>

        {hex.number && (
          <div
            style={{
              background: "white",
              color: "black",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "5px",
              fontWeight: "bold",
              border: "1px solid #333",
            }}
          >
            {hex.number}
          </div>
        )}

        {G.board.robberPosition === hex.id && <Robber />}

        {G.isRobberPlacing && G.board.robberPosition !== hex.id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              moves.placeRobber(hex.id);
            }}
            style={{
              position: "absolute",
              zIndex: 150,
              backgroundColor: "red",
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "5px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            PLACE
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
