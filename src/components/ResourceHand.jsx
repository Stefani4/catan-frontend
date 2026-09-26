import knightCard from "../../images/knightCard.png";
import victorypointCard from "../../images/victorypointCard.png";
import monopolyCard from "../../images/monopolyCard.png";
import roadbuildingCard from "../../images/roadbuildingCard.png";
import yearofplentyCard from "../../images/yearofplentyCard.png";
import lumberCard from "../../images/lumberCard.png";
import grainCard from "../../images/grainCard.png";
import woolCard from "../../images/woolCard.png";
import brickCard from "../../images/brickCard.png";
import oreCard from "../../images/oreCard.png";
import { useTranslation } from "../i18n.js";

const RES_KEY = { lumber: "resLumber", grain: "resGrain", wool: "resWool", brick: "resBrick", ore: "resOre" };
const DEV_KEY = {
    knight: "cardKnight",
    victorypoint: "cardVictoryPoint",
    monopoly: "cardMonopoly",
    roadbuilding: "cardRoadBuilding",
    yearofplenty: "cardYearOfPlenty",
};

const RESOURCE_CARDS = [
    { key: "lumber", img: lumberCard, label: "Lumber" },
    { key: "grain", img: grainCard, label: "Grain" },
    { key: "wool", img: woolCard, label: "Wool" },
    { key: "brick", img: brickCard, label: "Brick" },
    { key: "ore", img: oreCard, label: "Ore" },
];

const DEV_CARD_IMAGES = {
    knight: { img: knightCard, label: "Knight" },
    victorypoint: { img: victorypointCard, label: "Victory Point" },
    monopoly: { img: monopolyCard, label: "Monopoly" },
    roadbuilding: { img: roadbuildingCard, label: "Road Building" },
    yearofplenty: { img: yearofplentyCard, label: "Year of Plenty" },
};

function normalizeDevType(card) {
    const raw = typeof card === "string" ? card : card?.type;
    return (raw || "").toLowerCase().replace(/[\s_-]/g, "");
}

function Card({ img, label, count, faded }) {
    return (
        <div
            title={label}
            style={{
                position: "relative",
                width: "72px",
                height: "104px",
                borderRadius: "8px",
                overflow: "visible",
                boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                transform: "translateY(0)",
                transition: "transform 0.15s ease-out",
                opacity: faded ? 0.45 : 1,
                cursor: "default",
                flexShrink: 0,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            <img
                src={img}
                alt={label}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "2px solid #4a3210",
                    display: "block",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    minWidth: "22px",
                    height: "22px",
                    padding: "0 4px",
                    borderRadius: "11px",
                    background: "linear-gradient(135deg, #c9922f, #8a5a20)",
                    border: "2px solid #f1d38a",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                    fontFamily: "Georgia, serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                }}
            >
                {count}
            </div>
        </div>
    );
}

function ResourcePickerOverlay({ title, subtitle, onPick, onCancel }) {
    const { t: tr } = useTranslation();
    return (
        <div
            style={{
                position: "absolute",
                bottom: "calc(100% + 12px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: "linear-gradient(160deg, #efe2bd, #ddc99a)",
                border: "3px solid #7a5320",
                borderRadius: "12px",
                padding: "14px 18px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                zIndex: 50,
                minWidth: "320px",
                textAlign: "center",
                fontFamily: "Georgia, serif",
            }}
        >
            <div style={{ fontWeight: "bold", color: "#3a2409", marginBottom: "2px" }}>
                {title}
            </div>
            {subtitle && (
                <div style={{ fontSize: "0.75rem", color: "#5a4326", marginBottom: "10px" }}>
                    {subtitle}
                </div>
            )}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "8px" }}>
                {RESOURCES_LIST.map((r) => (
                    <button
                        key={r.key}
                        onClick={() => onPick(r.key)}
                        title={tr(RES_KEY[r.key])}
                        style={{
                            border: "2px solid #c9a96e",
                            borderRadius: "8px",
                            padding: "4px",
                            background: "#fbf3dd",
                            cursor: "pointer",
                        }}
                    >
                        <img src={r.img} alt={tr(RES_KEY[r.key])} style={{ width: "40px", height: "56px", objectFit: "cover", borderRadius: "4px" }} />
                    </button>
                ))}
            </div>
            <button
                onClick={onCancel}
                style={{
                    marginTop: "10px",
                    background: "none",
                    border: "none",
                    color: "#8a2f1f",
                    fontSize: "0.75rem",
                    textDecoration: "underline",
                    cursor: "pointer",
                }}
            >
                {tr("cancel")}
            </button>
        </div>
    );
}

const RESOURCES_LIST = [
    { key: "lumber", img: lumberCard, label: "Lumber" },
    { key: "grain", img: grainCard, label: "Grain" },
    { key: "wool", img: woolCard, label: "Wool" },
    { key: "brick", img: brickCard, label: "Brick" },
    { key: "ore", img: oreCard, label: "Ore" },
];

const DEV_CARD_COST = { ore: 1, grain: 1, wool: 1 };

export default function ResourceHand({ G, ctx, moves, playerID, pendingCardAction, setPendingCardAction }) {
    const { t: tr } = useTranslation();
    const viewingId = playerID !== undefined ? playerID : ctx.currentPlayer;
    const player = G.players[viewingId];
    if (!player) return null;

    const isMyTurn = String(ctx.currentPlayer) === String(viewingId);
    const canPlayCards = isMyTurn && !G.devCardPlayedThisTurn;

    const devCounts = {};
    const devCardsByType = {};
    (player.developmentCards || []).forEach((c) => {
        const t = normalizeDevType(c);
        devCounts[t] = (devCounts[t] || 0) + 1;
        if (!devCardsByType[t]) devCardsByType[t] = [];
        devCardsByType[t].push(c);
    });

    const ownedDevCards = Object.keys(devCounts)
        .filter((t) => DEV_CARD_IMAGES[t])
        .map((t) => ({ key: t, count: devCounts[t], ...DEV_CARD_IMAGES[t] }));

    const canAffordDevCard = ["ore", "grain", "wool"].every(
        (r) => (player.resources?.[r] || 0) >= DEV_CARD_COST[r],
    );
    const deckHasCards = (G.devCardDeck?.length ?? 0) > 0;

    const handleCardClick = (typeKey) => {
        if (!canPlayCards) return;

        if (typeKey === "knight") {
            moves.playKnight();
        } else if (typeKey === "monopoly") {
            setPendingCardAction({ type: "monopoly" });
        } else if (typeKey === "yearofplenty") {
            setPendingCardAction({ type: "yearOfPlenty", picks: [] });
        } else if (typeKey === "roadbuilding") {
            setPendingCardAction({ type: "roadBuilding", picks: [] });
        }
    };

    const handleMonopolyPick = (resource) => {
        moves.playMonopoly(resource);
        setPendingCardAction(null);
    };

    const handleYearOfPlentyPick = (resource) => {
        const picks = [...(pendingCardAction.picks || []), resource];
        if (picks.length >= 2) {
            moves.playYearOfPlenty(picks[0], picks[1]);
            setPendingCardAction(null);
        } else {
            setPendingCardAction({ ...pendingCardAction, picks });
        }
    };

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                gap: "10px",
                padding: "14px 20px 18px",
                background: "linear-gradient(180deg, rgba(28,18,8,0.55), rgba(28,18,8,0.85))",
                borderRadius: "16px",
                border: "1px solid rgba(201,169,110,0.4)",
                backdropFilter: "blur(2px)",
            }}
        >
            {pendingCardAction?.type === "monopoly" && (
                <ResourcePickerOverlay
                    title={tr("monopolyTitle")}
                    subtitle={tr("monopolySubtitle")}
                    onPick={handleMonopolyPick}
                    onCancel={() => setPendingCardAction(null)}
                />
            )}
            {pendingCardAction?.type === "yearOfPlenty" && (
                <ResourcePickerOverlay
                    title={tr("yearOfPlentyTitle")}
                    subtitle={tr("yearOfPlentySubtitle", { n: 2 - (pendingCardAction.picks?.length || 0) })}
                    onPick={handleYearOfPlentyPick}
                    onCancel={() => setPendingCardAction(null)}
                />
            )}
            {pendingCardAction?.type === "roadBuilding" && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "calc(100% + 12px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "linear-gradient(160deg, #efe2bd, #ddc99a)",
                        border: "3px solid #7a5320",
                        borderRadius: "12px",
                        padding: "12px 18px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                        zIndex: 50,
                        minWidth: "300px",
                        textAlign: "center",
                        fontFamily: "Georgia, serif",
                    }}
                >
                    <div style={{ fontWeight: "bold", color: "#3a2409" }}>{tr("roadBuildingTitle")}</div>
                    <div style={{ fontSize: "0.75rem", color: "#5a4326", marginTop: "4px" }}>
                        {tr("roadBuildingSubtitle")}
                        {" "}({tr("picked", { n: pendingCardAction.picks?.length || 0 })})
                    </div>
                    <button
                        onClick={() => {
                            const picks = pendingCardAction.picks || [];
                            if (picks.length > 0) moves.playRoadBuilding(picks);
                            setPendingCardAction(null);
                        }}
                        disabled={(pendingCardAction.picks?.length || 0) === 0}
                        style={{
                            marginTop: "8px",
                            marginRight: "8px",
                            padding: "5px 14px",
                            borderRadius: "6px",
                            border: "1.5px solid #c9a96e",
                            background: (pendingCardAction.picks?.length || 0) === 0 ? "#a68b5b" : "#8a5a20",
                            color: "white",
                            fontWeight: "bold",
                            cursor: (pendingCardAction.picks?.length || 0) === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        {tr("done")}
                    </button>
                    <button
                        onClick={() => setPendingCardAction(null)}
                        style={{ background: "none", border: "none", color: "#8a2f1f", fontSize: "0.75rem", textDecoration: "underline", cursor: "pointer" }}
                    >
                        {tr("cancel")}
                    </button>
                </div>
            )}

            {ownedDevCards.map((c) => (
                <div
                    key={c.key}
                    onClick={() => handleCardClick(c.key)}
                    style={{ cursor: canPlayCards && c.key !== "victorypoint" ? "pointer" : "default" }}
                >
                    <Card
                        img={c.img}
                        label={c.key === "victorypoint" ? tr("secretSuffix", { label: tr(DEV_KEY[c.key]) }) : tr("playCard", { label: tr(DEV_KEY[c.key]) })}
                        count={c.count}
                        faded={!canPlayCards && c.key !== "victorypoint"}
                    />
                </div>
            ))}

            <button
                onClick={() => moves.buyDevelopmentCard()}
                disabled={!isMyTurn || !canAffordDevCard || !deckHasCards}
                title={
                    !deckHasCards
                        ? tr("deckEmpty")
                        : tr("devCardCostTt")
                }
                style={{
                    width: "72px",
                    height: "104px",
                    borderRadius: "8px",
                    border: "2px dashed #c9a96e",
                    background: "rgba(0,0,0,0.25)",
                    color: "#f1d38a",
                    fontFamily: "Georgia, serif",
                    fontWeight: "bold",
                    fontSize: "0.7rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    cursor: !isMyTurn || !canAffordDevCard || !deckHasCards ? "not-allowed" : "pointer",
                    opacity: !isMyTurn || !canAffordDevCard || !deckHasCards ? 0.5 : 1,
                    flexShrink: 0,
                }}
            >
                <span style={{ fontSize: "1.3rem" }}>+</span>
                <span>{tr("buyCard")}</span>
                <span style={{ fontSize: "0.6rem", opacity: 0.85 }}>{tr("cardsLeft", { n: G.devCardDeck?.length ?? 0 })}</span>
            </button>

            {ownedDevCards.length > 0 && (
                <div
                    style={{
                        width: "1px",
                        alignSelf: "stretch",
                        background: "rgba(201,169,110,0.4)",
                        margin: "0 2px",
                    }}
                />
            )}

            {RESOURCE_CARDS.map((r) => {
                const count = player.resources?.[r.key] || 0;
                return (
                    <Card
                        key={r.key}
                        img={r.img}
                        label={tr(RES_KEY[r.key])}
                        count={count}
                        faded={count === 0}
                    />
                );
            })}
        </div>
    );
}