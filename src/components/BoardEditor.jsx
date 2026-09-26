import { useMemo, useState } from "react";
import {
    generateHexagonAxialCoords,
    computeHexAdjacency,
    computeTerrainCounts,
    generateConstrainedTerrains,
    generateNumberPool,
    axialToPixel,
} from "../../game/board.js";
import { useTranslation } from "../i18n.js";
import desertimg from "../../images/desert.png";
import fieldsimg from "../../images/field.png";
import forestimg from "../../images/forest.png";
import hillsimg from "../../images/hills.png";
import mountainsimg from "../../images/mountain.png";
import pastureimg from "../../images/pasture.png";

const HEX_RADIUS = 2; // matches MAP_TYPES.custom / "standard" shape (19 hexes)
const HEX_SIZE = 57; // matches the in-game board's hex size exactly

const TERRAIN_CYCLE = ["forest", "hills", "fields", "pasture", "mountains", "desert"];
const TERRAIN_IMAGE = {
    forest: forestimg,
    hills: hillsimg,
    fields: fieldsimg,
    pasture: pastureimg,
    mountains: mountainsimg,
    desert: desertimg,
};
const NUMBER_OPTIONS = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];

function randomLayout() {
    const axialCoords = generateHexagonAxialCoords(HEX_RADIUS);
    const adjacency = computeHexAdjacency(axialCoords);
    const counts = computeTerrainCounts(axialCoords.length);
    const terrains = generateConstrainedTerrains(adjacency, counts);
    const numbers = generateNumberPool(axialCoords.length - counts.desert);
    let ni = 0;
    return terrains.map((terrain) => ({
        terrain,
        number: terrain === "desert" ? null : numbers[ni++],
    }));
}

export default function BoardEditor({ initialBoard, onSave, onCancel }) {
    const { t } = useTranslation();
    const axialCoords = useMemo(() => generateHexagonAxialCoords(HEX_RADIUS), []);
    const [hexes, setHexes] = useState(() => {
        if (initialBoard?.hexes?.length === axialCoords.length) return initialBoard.hexes.map((h) => ({ ...h }));
        return randomLayout();
    });
    const [numberPickerIndex, setNumberPickerIndex] = useState(null);
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const desertCount = hexes.filter((h) => h.terrain === "desert").length;
    const isValid = desertCount === 1;

    const points = axialCoords.map(({ q, r }) => axialToPixel(q, r, HEX_SIZE));
    const minX = Math.min(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxX = Math.max(...points.map((p) => p.x));
    const maxY = Math.max(...points.map((p) => p.y));
    const pad = HEX_SIZE;
    const width = maxX - minX + pad * 2;
    const height = maxY - minY + pad * 2;
    const hexWidth = HEX_SIZE * Math.sqrt(3);
    const hexHeight = HEX_SIZE * 2;

    const cycleTerrain = (index) => {
        setHexes((prev) => {
            const next = [...prev];
            const current = next[index].terrain;
            const nextTerrain = TERRAIN_CYCLE[(TERRAIN_CYCLE.indexOf(current) + 1) % TERRAIN_CYCLE.length];
            next[index] = {
                terrain: nextTerrain,
                number: nextTerrain === "desert" ? null : next[index].number || 6,
            };
            return next;
        });
    };

    const swapHexes = (indexA, indexB) => {
        if (indexA === null || indexB === null || indexA === indexB) return;
        setHexes((prev) => {
            const next = [...prev];
            [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
            return next;
        });
    };

    const handleDragStart = (index) => (e) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Firefox requires setData to initiate a drag
        e.dataTransfer.setData("text/plain", String(index));
    };

    const handleDragOver = (index) => (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverIndex !== index) setDragOverIndex(index);
    };

    const handleDrop = (index) => (e) => {
        e.preventDefault();
        swapHexes(dragIndex, index);
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const setNumber = (index, number) => {
        setHexes((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], number };
            return next;
        });
        setNumberPickerIndex(null);
    };

    const handleSave = () => {
        if (!isValid) return;
        onSave({ hexes });
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 500,
                padding: "16px",
            }}
        >
            <div
                style={{
                    background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                    border: "3px solid #7a5320",
                    borderRadius: "14px",
                    padding: "20px 26px",
                    fontFamily: "Georgia, serif",
                    color: "#3a2409",
                    maxWidth: "620px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 10px 50px rgba(0,0,0,0.6)",
                }}
            >
                <h2 style={{ margin: "0 0 4px 0" }}>{t("boardEditorTitle")}</h2>
                <p style={{ fontSize: "0.78rem", color: "#5a4326", margin: "0 0 14px 0" }}>
                    {t("boardEditorHint")}
                </p>

                <div
                    style={{
                        position: "relative",
                        width: `${width}px`,
                        height: `${height}px`,
                        margin: "0 auto 14px",
                    }}
                >
                    {axialCoords.map(({ q, r }, i) => {
                        const p = axialToPixel(q, r, HEX_SIZE);
                        const cx = p.x - minX + pad;
                        const cy = p.y - minY + pad;
                        const hex = hexes[i];
                        const isDragging = dragIndex === i;
                        const isDragTarget = dragOverIndex === i && dragIndex !== null && dragIndex !== i;
                        return (
                            <div
                                key={i}
                                draggable
                                onDragStart={handleDragStart(i)}
                                onDragOver={handleDragOver(i)}
                                onDrop={handleDrop(i)}
                                onDragEnd={handleDragEnd}
                                style={{
                                    position: "absolute",
                                    left: `${cx - hexWidth / 2}px`,
                                    top: `${cy - hexHeight / 2}px`,
                                    width: `${hexWidth}px`,
                                    height: `${hexHeight}px`,
                                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                                    backgroundImage: `url(${TERRAIN_IMAGE[hex.terrain]})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    outline: isDragTarget
                                        ? "3px solid #f1d38a"
                                        : "1px solid rgba(0,0,0,0.35)",
                                    outlineOffset: isDragTarget ? "-3px" : "-1px",
                                    opacity: isDragging ? 0.4 : 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "grab",
                                    userSelect: "none",
                                    transition: "opacity 0.1s ease",
                                }}
                                onClick={() => cycleTerrain(i)}
                                title={t(`terrain${hex.terrain[0].toUpperCase()}${hex.terrain.slice(1)}Btn`)}
                            >
                                <span
                                    style={{
                                        fontSize: "0.62rem",
                                        fontWeight: "bold",
                                        color: "white",
                                        textShadow: "1px 1px 2px black",
                                        textTransform: "capitalize",
                                    }}
                                >
                                    {hex.terrain}
                                </span>
                                {hex.terrain !== "desert" && (
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNumberPickerIndex(i);
                                        }}
                                        style={{
                                            marginTop: "2px",
                                            background: "#fbf3dd",
                                            border: "1px solid #7a5320",
                                            borderRadius: "50%",
                                            width: "22px",
                                            height: "22px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.7rem",
                                            fontWeight: "bold",
                                            color: hex.number === 6 || hex.number === 8 ? "#c0392b" : "#3a2409",
                                        }}
                                    >
                                        {hex.number}
                                    </span>
                                )}

                                {numberPickerIndex === i && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            marginTop: "4px",
                                            display: "grid",
                                            gridTemplateColumns: "repeat(5, 1fr)",
                                            gap: "2px",
                                            background: "#241708",
                                            border: "1px solid #7a5320",
                                            borderRadius: "8px",
                                            padding: "5px",
                                            zIndex: 10,
                                        }}
                                    >
                                        {NUMBER_OPTIONS.map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setNumber(i, n)}
                                                style={{
                                                    width: "22px",
                                                    height: "22px",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    background: n === hex.number ? "#c9922f" : "#3a2818",
                                                    color: "#f2e6c9",
                                                    fontSize: "0.68rem",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <p
                    style={{
                        textAlign: "center",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        color: isValid ? "#2e6b3e" : "#8a2020",
                        margin: "0 0 14px 0",
                    }}
                >
                    {isValid ? t("desertCountOk") : t("desertCountBad", { n: desertCount })}
                </p>

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                        onClick={() => setHexes(randomLayout())}
                        style={{
                            padding: "9px 16px",
                            borderRadius: "8px",
                            border: "2px solid #7a5320",
                            background: "rgba(255,255,255,0.4)",
                            color: "#3a2409",
                            fontWeight: "bold",
                            fontFamily: "Georgia, serif",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                        }}
                    >
                        {t("randomFill")}
                    </button>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: "9px 16px",
                            borderRadius: "8px",
                            border: "2px solid #7a5320",
                            background: "rgba(255,255,255,0.4)",
                            color: "#3a2409",
                            fontWeight: "bold",
                            fontFamily: "Georgia, serif",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                        }}
                    >
                        {t("cancelEdit")}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isValid}
                        style={{
                            padding: "9px 20px",
                            borderRadius: "8px",
                            border: "2px solid #f1d38a",
                            background: isValid ? "linear-gradient(135deg, #8a5a20, #c9922f)" : "rgba(122,83,32,0.4)",
                            color: "white",
                            fontWeight: "bold",
                            fontFamily: "Georgia, serif",
                            fontSize: "0.82rem",
                            cursor: isValid ? "pointer" : "default",
                        }}
                    >
                        {t("saveBoard")}
                    </button>
                </div>
            </div>
        </div>
    );
}