import { useState } from "react";
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

const BUILD_ITEMS = [
    { key: "road", label: "Road", icon: "🛤️", costs: { brick: 1, lumber: 1 } },
    {
        key: "settlement",
        label: "Settlement",
        icon: "🏠",
        costs: { brick: 1, lumber: 1, grain: 1, wool: 1 },
    },
    { key: "city", label: "City", icon: "🏰", costs: { grain: 2, ore: 3 } },
    {
        key: "resort",
        label: "Resort",
        icon: "🏖️",
        costs: { ore: 3, lumber: 4, wool: 2, brick: 1 },
        hint: "Click an opponent's city to seize it.",
    },
    {
        key: "devCard",
        label: "Dev Card",
        icon: "🃏",
        costs: { ore: 1, grain: 1, wool: 1 },
    },
    {
        key: "clearRobber",
        label: "Clear Robber",
        icon: "💰",
        costs: { brick: 1, lumber: 1, grain: 1, wool: 1, ore: 1 },
        hint: "Pay to send the Robber back to the desert.",
    },
];

function CostChip({ resource, amount, affordable }) {
    return (
        <div
            title={`${amount} ${resource}`}
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                opacity: affordable ? 1 : 0.4,
            }}
        >
            <img
                src={RESOURCE_ICONS[resource]}
                alt={resource}
                style={{
                    width: "20px",
                    height: "28px",
                    objectFit: "cover",
                    borderRadius: "3px",
                    border: "1px solid #4a3210",
                }}
            />
            <span
                style={{
                    position: "absolute",
                    bottom: "-5px",
                    right: "-5px",
                    background: "#2c1e0e",
                    color: "#f1d38a",
                    fontSize: "0.6rem",
                    fontWeight: "bold",
                    borderRadius: "7px",
                    minWidth: "13px",
                    height: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #c9a96e",
                }}
            >
                {amount}
            </span>
        </div>
    );
}

export default function BuildCostsPanel({ G, playerID }) {
    const [expandedKey, setExpandedKey] = useState(null);

    const viewingId = playerID !== undefined ? playerID : G ? Object.keys(G.players)[0] : undefined;
    const player = G?.players?.[viewingId];
    const resortEnabled = G?.settings?.resortEnabled !== false;
    const robberPayToClear = G?.settings?.robberPayToClear !== false;
    const items = BUILD_ITEMS.filter((item) => {
        if (item.key === "resort") return resortEnabled;
        if (item.key === "clearRobber") return robberPayToClear;
        return true;
    });

    return (
        <div
            style={{
                width: "170px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontFamily: "Georgia, serif",
            }}
        >
            <div
                style={{
                    fontSize: "0.68rem",
                    fontWeight: "bold",
                    color: "#c9a96e",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    padding: "0 4px 2px",
                }}
            >
                🔨 Build Costs
            </div>

            {items.map((item) => {
                const isOpen = expandedKey === item.key;
                return (
                    <div
                        key={item.key}
                        style={{
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid rgba(201,169,110,0.4)",
                            background: "rgba(28,18,8,0.75)",
                            backdropFilter: "blur(2px)",
                        }}
                    >
                        <button
                            onClick={() => setExpandedKey(isOpen ? null : item.key)}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "6px",
                                padding: "7px 10px",
                                background: isOpen ? "rgba(201,169,110,0.18)" : "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#f2e6c9",
                                fontFamily: "Georgia, serif",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                            }}
                        >
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </span>
                            <span style={{ fontSize: "0.6rem", opacity: 0.75 }}>{isOpen ? "▲" : "▼"}</span>
                        </button>

                        {isOpen && (
                            <div
                                style={{
                                    padding: "4px 10px 9px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                }}
                            >
                                {item.hint && (
                                    <div style={{ fontSize: "0.6rem", color: "#f1c40f", fontStyle: "italic" }}>
                                        {item.hint}
                                    </div>
                                )}
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                    {Object.entries(item.costs).map(([resource, amount]) => (
                                        <CostChip
                                            key={resource}
                                            resource={resource}
                                            amount={amount}
                                            affordable={!player || (player.resources?.[resource] ?? 0) >= amount}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
