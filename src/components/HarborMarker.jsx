import dock1 from "../../images/dock1.png";
import dock2 from "../../images/dock2.png";
import brickCard from "../../images/brickCard.png";
import lumberCard from "../../images/lumberCard.png";
import grainCard from "../../images/grainCard.png";
import woolCard from "../../images/woolCard.png";
import oreCard from "../../images/oreCard.png";

const RESOURCE_ICONS = {
  brick: brickCard,
  lumber: lumberCard,
  grain: grainCard,
  wool: woolCard,
  ore: oreCard,
};

export default function HarborMarker({ harbor }) {
  const isGeneric = harbor.type === "generic";
  const dockImg = isGeneric ? dock1 : dock2;

  return (
    <div
      title={isGeneric ? "3:1 Harbor" : `2:1 ${harbor.type} Harbor`}
      style={{
        position: "absolute",
        left: `${harbor.x}px`,
        top: `${harbor.y}px`,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <img
        src={dockImg}
        alt={isGeneric ? "3:1 harbor" : `2:1 ${harbor.type} harbor`}
        style={{ width: "26px", height: "26px", objectFit: "contain" }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          background: "rgba(20,10,0,0.75)",
          border: "1px solid #f2e6c9",
          borderRadius: "8px",
          padding: "1px 5px",
          marginTop: "-2px",
        }}
      >
        {!isGeneric && (
          <img
            src={RESOURCE_ICONS[harbor.type]}
            alt={harbor.type}
            style={{ width: "12px", height: "12px", objectFit: "contain" }}
          />
        )}
        <span style={{ color: "#f2e6c9", fontSize: "0.6rem", fontWeight: "bold" }}>
          {harbor.ratio}:1
        </span>
      </div>
    </div>
  );
}
