import desertimg from "../../images/desert.png";
import fieldsimg from "../../images/field.png";
import forestimg from "../../images/forest.png";
import hillsimg from "../../images/hills.png";
import mountainsimg from "../../images/mountain.png";
import pastureimg from "../../images/pasture.png";
import robberimg from "../../images/robber.png";
const images = {
  hills: hillsimg,
  forest: forestimg,
  fields: fieldsimg,
  pasture: pastureimg,
  mountains: mountainsimg,
  desert: desertimg,
  Robber: robberimg,
};

const Robber = () => (
  <div style={{
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 100
  }}>
    <img
      src={robberimg}
      alt="Robber"
      style={{ width: "40px", height: "40px", objectFit: "contain" }}
    />
  </div>
);

export default function Hex({ hex, G, moves, width, height }) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${hex.x}px`,
        top: `${hex.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${images[hex.terrain]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <span style={{ fontWeight: "bold", fontSize: "0.8rem", color: "white", textShadow: "1px 1px 2px black" }}>
          {hex.terrain}
        </span>

        {hex.number && (
          <div style={{ background: "white", color: "black", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "5px", fontWeight: "bold", border: "1px solid #333" }}>
            {hex.number}
          </div>
        )}

        {G.board.robberPosition === hex.id && <Robber />}

        {G.isRobberPlacing && G.board.robberPosition !== hex.id && (
          <button
            onClick={(e) => { e.stopPropagation(); moves.placeRobber(hex.id); }}
            style={{ position: "absolute", zIndex: 150, backgroundColor: "red", color: "white", border: "none", borderRadius: "5px", padding: "5px", fontWeight: "bold", cursor: "pointer" }}
          >
            PLACE
          </button>
        )}
      </div>
    </div>
  );
}
