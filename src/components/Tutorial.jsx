import { useState, useEffect, useMemo } from "react";

const SIZE = 54;
const axialHexes = [
    { q: 0, r: 0, resource: "desert", number: null, label: "Desert" },
    { q: 1, r: 0, resource: "forest", number: 4, label: "Forest" },
    { q: 1, r: -1, resource: "hills", number: 10, label: "Hills" },
    { q: 0, r: -1, resource: "fields", number: 6, label: "Fields" },
    { q: -1, r: 0, resource: "pasture", number: 8, label: "Pasture" },
    { q: -1, r: 1, resource: "mountains", number: 9, label: "Mountains" },
    { q: 0, r: 1, resource: "fields", number: 5, label: "Fields" },
];
const PLAYER_COLOR = { you: "#C0392B", rival: "#2A5D8C" };
const RESOURCE_META = {
    forest: { icon: "🌲", color: "#3E5C3A", name: "Lumber" },
    hills: { icon: "🧱", color: "#A34E2C", name: "Brick" },
    fields: { icon: "🌾", color: "#C79A2A", name: "Grain" },
    pasture: { icon: "🐑", color: "#8E9E6E", name: "Wool" },
    mountains: { icon: "⛰️", color: "#5C6570", name: "Ore" },
    desert: { icon: "🏜️", color: "#C9B37E", name: "—" },
};
function axialToPixel(q, r) {
    return { x: SIZE * Math.sqrt(3) * (q + r / 2), y: SIZE * 1.5 * r };
}
function hexCornerPts(cx, cy) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 180) * (60 * i - 30);
        pts.push({ x: cx + SIZE * Math.cos(ang), y: cy + SIZE * Math.sin(ang) });
    }
    return pts;
}
function keyFor(x, y) {
    return x.toFixed(1) + "_" + y.toFixed(1);
}

const corners = {};
const cornerKeyToId = {};
const edges = {};
const edgeKeyToId = {};
const hexes = [];
let cornerCounter = 0,
    edgeCounter = 0;

axialHexes.forEach((h, hi) => {
    const { x: cx, y: cy } = axialToPixel(h.q, h.r);
    const pts = hexCornerPts(cx, cy);
    const cornerIds = pts.map((p) => {
        const k = keyFor(p.x, p.y);
        if (!(k in cornerKeyToId)) {
            cornerKeyToId[k] = cornerCounter;
            corners[cornerCounter] = { x: p.x, y: p.y, neighbors: new Set(), hexIds: new Set() };
            cornerCounter++;
        }
        return cornerKeyToId[k];
    });
    const hexId = hi;
    hexes.push({ id: hexId, q: h.q, r: h.r, resource: h.resource, number: h.number, label: h.label, cx, cy, cornerIds });
    cornerIds.forEach((cid) => corners[cid].hexIds.add(hexId));
    for (let i = 0; i < 6; i++) {
        const a = cornerIds[i],
            b = cornerIds[(i + 1) % 6];
        const ek = a < b ? a + "-" + b : b + "-" + a;
        if (!(ek in edgeKeyToId)) {
            edgeKeyToId[ek] = edgeCounter;
            edges[edgeCounter] = { a, b };
            edgeCounter++;
        }
        corners[a].neighbors.add(b);
        corners[b].neighbors.add(a);
    }
});

const COSTS = {
    road: { lumber: 1, brick: 1 },
    settlement: { lumber: 1, brick: 1, grain: 1, wool: 1 },
    city: { grain: 2, ore: 3 },
    resort: { ore: 3, lumber: 4, wool: 2, brick: 1 },
};
const SEASONS = [
    { name: "Spring", icon: "🌸" },
    { name: "Summer", icon: "☀️" },
    { name: "Autumn", icon: "🍂" },
    { name: "Winter", icon: "❄️" },
];
const CHAPTERS = [
    { id: "toc", icon: "📜", label: "Almanac" },
    { id: "roads", icon: "🛣️", label: "Roads" },
    { id: "settlements", icon: "🏠", label: "Settlements" },
    { id: "cities", icon: "🏙️", label: "Cities" },
    { id: "robber", icon: "🏴", label: "The Robber" },
    { id: "seasons", icon: "🌸", label: "Seasons & Dice" },
    { id: "resort", icon: "🏝️", label: "The Resort" },
];
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
const RES_ICON = { lumber: "🌲", brick: "🧱", grain: "🌾", wool: "🐑", ore: "⛰️" };
const COST_NAMES = {
    lumber: ["Lumber", "var(--lumber)"],
    brick: ["Brick", "var(--brick)"],
    grain: ["Grain", "var(--grain)"],
    wool: ["Wool", "var(--wool)"],
    ore: ["Ore", "var(--ore)"],
};

function canAfford(cost, resources) {
    return Object.keys(cost).every((k) => resources[k] >= cost[k]);
}
function distanceOk(cornerId, buildings) {
    if (buildings[cornerId]) return false;
    for (const n of corners[cornerId].neighbors) {
        if (buildings[n]) return false;
    }
    return true;
}
function connectedToOwnRoad(cornerId, roads) {
    return Object.keys(roads).some((eid) => {
        const e = edges[eid];
        return roads[eid].owner === "you" && (e.a == cornerId || e.b == cornerId);
    });
}
function edgeTouchesOwn(edgeId, roads, buildings) {
    const e = edges[edgeId];
    const cornerTouch = (buildings[e.a] && buildings[e.a].owner === "you") || (buildings[e.b] && buildings[e.b].owner === "you");
    const roadTouch = Object.keys(roads).some((eid2) => {
        const e2 = edges[eid2];
        if (roads[eid2].owner !== "you") return false;
        return e2.a === e.a || e2.a === e.b || e2.b === e.a || e2.b === e.b;
    });
    return cornerTouch || roadTouch;
}

function CostPills({ cost }) {
    return (
        <div className="alm-cost-line">
            {Object.keys(cost).map((k) => (
                <span key={k} className="alm-cost-pill" style={{ background: COST_NAMES[k][1] }}>
                    {cost[k]} {COST_NAMES[k][0]}
                </span>
            ))}
        </div>
    );
}

function Legend() {
    return (
        <div className="alm-legend">
            <span>
                <span className="alm-swatch" style={{ background: "#C0392B" }}></span>Yours
            </span>
            <span>
                <span className="alm-swatch" style={{ background: "#2A5D8C" }}></span>Rival
            </span>
            <span>
                <span className="alm-swatch" style={{ background: "#C9B37E" }}></span>Desert / Robber start
            </span>
        </div>
    );
}

function Board({ buildings, roads, robberHex, currentMode, resources, onCornerClick, onEdgeClick, onHexClick }) {
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
    Object.values(corners).forEach((c) => {
        minX = Math.min(minX, c.x);
        maxX = Math.max(maxX, c.x);
        minY = Math.min(minY, c.y);
        maxY = Math.max(maxY, c.y);
    });
    const pad = 26;
    const vb = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

    return (
        <svg className="alm-board-svg" viewBox={vb} width="100%" height="380" xmlns="http://www.w3.org/2000/svg">
            {hexes.map((h) => {
                const meta = RESOURCE_META[h.resource];
                const robberHere = robberHex === h.id;
                const clickable = currentMode === "robber" && !robberHere;
                const pts = h.cornerIds.map((cid) => corners[cid].x.toFixed(1) + "," + corners[cid].y.toFixed(1)).join(" ");
                return (
                    <g
                        key={`hex-${h.id}`}
                        className={`alm-hex ${clickable ? "alm-clickable" : ""}`}
                        onClick={clickable ? () => onHexClick(h.id) : undefined}
                    >
                        <polygon points={pts} fill={meta.color} stroke="#2c1c10" strokeWidth="1.5" opacity="0.92" />
                        <text x={h.cx} y={h.cy - 6} textAnchor="middle" fontSize="15">
                            {meta.icon}
                        </text>
                        {h.number ? (
                            <>
                                <circle cx={h.cx} cy={h.cy + 14} r="11" fill="#f4e9cf" stroke="#2c1c10" strokeWidth="1" />
                                <text
                                    x={h.cx}
                                    y={h.cy + 18}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fontWeight="bold"
                                    fill={h.number === 6 || h.number === 8 ? "#a33" : "#2c1c10"}
                                >
                                    {h.number}
                                </text>
                            </>
                        ) : null}
                        {robberHere ? (
                            <text x={h.cx} y={h.cy + 38} textAnchor="middle" fontSize="18">
                                🥷
                            </text>
                        ) : null}
                    </g>
                );
            })}

            {Object.keys(edges).map((eidStr) => {
                const eid = +eidStr;
                const e = edges[eid];
                const a = corners[e.a],
                    b = corners[e.b];
                const built = roads[eid];
                const isValid = currentMode === "road" && !built && (Object.keys(roads).length === 0 ? true : edgeTouchesOwn(eid, roads, buildings));
                const clickable = currentMode === "road" && !built;
                const stroke = built ? (built.owner === "you" ? PLAYER_COLOR.you : PLAYER_COLOR.rival) : "rgba(255,255,255,0.55)";
                const width = built ? 6 : 3;
                return (
                    <g key={`edge-${eid}`}>
                        {clickable && (
                            <line
                                className={`alm-edge-line alm-clickable ${isValid ? "alm-valid" : ""}`}
                                x1={a.x.toFixed(1)}
                                y1={a.y.toFixed(1)}
                                x2={b.x.toFixed(1)}
                                y2={b.y.toFixed(1)}
                                stroke={isValid ? "rgba(212,167,44,0.4)" : "rgba(0,0,0,0.001)"}
                                strokeWidth="22"
                                strokeLinecap="round"
                                onClick={() => onEdgeClick(eid)}
                            />
                        )}
                        <line
                            x1={a.x.toFixed(1)}
                            y1={a.y.toFixed(1)}
                            x2={b.x.toFixed(1)}
                            y2={b.y.toFixed(1)}
                            stroke={stroke}
                            strokeWidth={width}
                            strokeLinecap="round"
                            style={{ pointerEvents: "none" }}
                        />
                    </g>
                );
            })}

            {Object.keys(corners).map((cidStr) => {
                const cid = +cidStr;
                const c = corners[cid];
                const b = buildings[cid];
                let isValid = false,
                    clickable = false;
                if (currentMode === "settlement-setup") {
                    clickable = true;
                    isValid = distanceOk(cid, buildings);
                } else if (currentMode === "settlement-build") {
                    clickable = true;
                    isValid = distanceOk(cid, buildings) && connectedToOwnRoad(cid, roads) && canAfford(COSTS.settlement, resources);
                } else if (currentMode === "city") {
                    clickable = !!(b && b.owner === "you" && b.level === "settlement");
                    isValid = clickable && canAfford(COSTS.city, resources);
                } else if (currentMode === "resort") {
                    clickable = !!(b && b.owner === "rival" && b.level === "city");
                    isValid = clickable && canAfford(COSTS.resort, resources);
                }
                return (
                    <g key={`corner-${cid}`}>
                        {clickable && (
                            <circle
                                className={`alm-corner-dot alm-clickable ${isValid ? "alm-valid" : ""}`}
                                cx={c.x.toFixed(1)}
                                cy={c.y.toFixed(1)}
                                r="17"
                                fill={isValid ? "rgba(212,167,44,0.4)" : "rgba(0,0,0,0.001)"}
                                stroke={isValid ? "rgba(212,167,44,0.9)" : "none"}
                                strokeWidth="1.5"
                                onClick={() => onCornerClick(cid)}
                            />
                        )}
                        <circle
                            cx={c.x.toFixed(1)}
                            cy={c.y.toFixed(1)}
                            r="7"
                            fill={b ? (b.owner === "you" ? PLAYER_COLOR.you : PLAYER_COLOR.rival) : "rgba(255,255,255,0.7)"}
                            stroke="#2c1c10"
                            strokeWidth="1.2"
                            style={{ pointerEvents: "none" }}
                        />
                        {b && (
                            <text x={c.x.toFixed(1)} y={(c.y - 11).toFixed(1)} textAnchor="middle" fontSize="12" style={{ pointerEvents: "none" }}>
                                {b.level === "city" ? "🏙️" : b.level === "resort" ? "🏝️" : "🏠"}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

export default function Tutorial({ onClose }) {
    const [resources, setResources] = useState({ lumber: 8, brick: 8, grain: 8, wool: 8, ore: 8 });
    const [buildings, setBuildings] = useState(() => {
        const RIVAL_CORNER = hexes[2].cornerIds[1];
        return { [RIVAL_CORNER]: { owner: "rival", level: "city" } };
    });

    const [roads, setRoads] = useState({ 0: { owner: "you" } });
    const [robberHex, setRobberHex] = useState(() => hexes.find((h) => h.resource === "desert").id);
    const [season, setSeason] = useState(0);
    const [rivalVp, setRivalVp] = useState(4);
    const [firstUseDone, setFirstUseDone] = useState({ road: false, settlement: false, city: false, resort: false, robberPeace: false });
    const [currentTab, setCurrentTab] = useState("toc");
    const [sMode, setSMode] = useState("setup");
    const [msg, setMsg] = useState("");
    const [diceResult, setDiceResult] = useState(null);
    const [flashKeys, setFlashKeys] = useState([]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    const currentMode = useMemo(() => {
        if (currentTab === "roads") return "road";
        if (currentTab === "settlements") return sMode === "setup" ? "settlement-setup" : "settlement-build";
        if (currentTab === "cities") return "city";
        if (currentTab === "robber") return "robber";
        if (currentTab === "resort") return "resort";
        return null;
    }, [currentTab, sMode]);

    const vp = useMemo(() => {
        let v = 0;
        Object.values(buildings).forEach((b) => {
            if (b.owner === "you") {
                if (b.level === "settlement") v += 1;
                else if (b.level === "city") v += 2;
                else if (b.level === "resort") v += 2;
            }
        });
        return v;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buildings]);

    useEffect(() => {
        setDiceResult(null);
        if (currentTab === "roads") setMsg("Click a highlighted path on the map to build a road.");
        else if (currentTab === "settlements")
            setMsg(
                sMode === "setup"
                    ? "Click a highlighted intersection to place a free starting settlement."
                    : "Click a highlighted intersection connected to your road to build a settlement."
            );
        else if (currentTab === "cities") setMsg("Click one of your gold settlements to upgrade it into a City.");
        else if (currentTab === "robber") setMsg("Click any tile to move the Robber there.");
        else if (currentTab === "resort") setMsg("Click the rival's City to attempt a takeover.");
        else setMsg("");
    }, [currentTab, sMode]);

    function flash(keys) {
        setFlashKeys(keys);
        setTimeout(() => setFlashKeys([]), 500);
    }
    function pay(cost) {
        setResources((prev) => {
            const next = { ...prev };
            Object.keys(cost).forEach((k) => (next[k] -= cost[k]));
            return next;
        });
        flash(Object.keys(cost));
    }

    function onCornerClick(cid) {
        if (currentMode === "settlement-setup") {
            if (!distanceOk(cid, buildings)) {
                setMsg("❌ Too close to another settlement — leave at least one empty intersection between them.");
                return;
            }
            setBuildings((prev) => ({ ...prev, [cid]: { owner: "you", level: "settlement" } }));
            setMsg("🏠 Free starting settlement placed! During setup, settlements cost nothing — but the distance rule still applies.");
        } else if (currentMode === "settlement-build") {
            if (!distanceOk(cid, buildings)) {
                setMsg("❌ Too close to another settlement or city.");
                return;
            }
            if (!connectedToOwnRoad(cid, roads)) {
                setMsg("❌ This spot isn't connected to one of your roads yet. Build a road here first (see the Roads chapter).");
                return;
            }
            const free = !firstUseDone.settlement;
            if (!free && !canAfford(COSTS.settlement, resources)) {
                setMsg("❌ Not enough resources. A settlement costs 1 Lumber + 1 Brick + 1 Grain + 1 Wool.");
                return;
            }
            if (free) setFirstUseDone((prev) => ({ ...prev, settlement: true }));
            else pay(COSTS.settlement);
            setBuildings((prev) => ({ ...prev, [cid]: { owner: "you", level: "settlement" } }));
            setMsg(
                free
                    ? "🏠 Settlement built! Your first one's on the house — from now on, settlements cost 1 Lumber + 1 Brick + 1 Grain + 1 Wool. Earned +1 Victory Point."
                    : "🏠 Settlement built! You paid 1 Lumber + 1 Brick + 1 Grain + 1 Wool, and earned +1 Victory Point."
            );
        } else if (currentMode === "city") {
            const b = buildings[cid];
            if (!b || b.owner !== "you" || b.level !== "settlement") {
                setMsg("❌ Pick one of your own settlements to upgrade.");
                return;
            }
            const free = !firstUseDone.city;
            if (!free && !canAfford(COSTS.city, resources)) {
                setMsg("❌ Not enough resources. A City costs 2 Grain + 3 Ore.");
                return;
            }
            if (free) setFirstUseDone((prev) => ({ ...prev, city: true }));
            else pay(COSTS.city);
            setBuildings((prev) => ({ ...prev, [cid]: { ...prev[cid], level: "city" } }));
            setMsg(
                free
                    ? "🏙️ Upgraded to a City! This first upgrade is free — after this, Cities cost 2 Grain + 3 Ore. It now produces 2 resources per roll and is worth 2 Victory Points."
                    : "🏙️ Upgraded to a City! You paid 2 Grain + 3 Ore. It now produces 2 resources per roll instead of 1, and is worth 2 Victory Points."
            );
        } else if (currentMode === "resort") {
            const b = buildings[cid];
            if (!b || b.owner !== "rival" || b.level !== "city") {
                setMsg("❌ You can only build a Resort on top of an opponent's City.");
                return;
            }
            const free = !firstUseDone.resort;
            if (!free && !canAfford(COSTS.resort, resources)) {
                setMsg("❌ Not enough resources. A Resort costs 3 Ore + 4 Lumber + 2 Wool + 1 Brick.");
                return;
            }
            if (free) setFirstUseDone((prev) => ({ ...prev, resort: true }));
            else pay(COSTS.resort);
            setRivalVp((prev) => prev - 2);
            setBuildings((prev) => ({ ...prev, [cid]: { owner: "you", level: "resort" } }));
            setMsg(
                free
                    ? "🏝️ Resort built for free this first time! Afterwards, Resorts cost 3 Ore + 4 Lumber + 2 Wool + 1 Brick. The rival's City is removed and they lose the 2 Victory Points it was worth."
                    : "🏝️ Resort built! You paid 3 Ore + 4 Lumber + 2 Wool + 1 Brick. The rival's City is removed and they lose the 2 Victory Points it was worth."
            );
        }
    }

    function onEdgeClick(eid) {
        if (currentMode !== "road") return;
        if (roads[eid]) {
            setMsg("❌ A road is already here.");
            return;
        }
        const noRoadsYet = Object.keys(roads).length === 0;
        if (!noRoadsYet && !edgeTouchesOwn(eid, roads, buildings)) {
            setMsg("❌ Roads must connect to one of your existing roads or buildings.");
            return;
        }
        const free = !firstUseDone.road;
        if (!free && !canAfford(COSTS.road, resources)) {
            setMsg("❌ Not enough resources. A road costs 1 Lumber + 1 Brick.");
            return;
        }
        if (free) setFirstUseDone((prev) => ({ ...prev, road: true }));
        else pay(COSTS.road);
        setRoads((prev) => ({ ...prev, [eid]: { owner: "you" } }));
        setMsg(
            free
                ? "🛣️ Road built! This first one's free — after this, roads cost 1 Lumber + 1 Brick. Roads must always connect to your existing network."
                : "🛣️ Road built for 1 Lumber + 1 Brick. Roads must always connect to your existing network."
        );
    }

    function onHexClick(hid) {
        if (currentMode !== "robber") return;
        if (robberHex === hid) {
            setMsg("The Robber is already sitting on this tile.");
            return;
        }
        setRobberHex(hid);
        const h = hexes.find((x) => x.id === hid);
        const occupied = h.cornerIds.some((cid) => buildings[cid]);
        if (occupied) {
            setMsg(`🏴 The Robber creeps onto the ${h.label} tile. It now blocks that tile from producing, and you may steal one random resource card from any player with a Settlement or City there.`);
        } else {
            setMsg(`🏴 The Robber moves to the ${h.label} tile. No one is settled there yet, so there's nothing to steal — but the tile is blocked until the Robber moves again.`);
        }
    }

    function robberPeace() {
        const h = hexes.find((x) => x.id === robberHex);
        const yoursHere = h && h.cornerIds.some((cid) => buildings[cid] && buildings[cid].owner === "you");
        if (!yoursHere) {
            setMsg("Robber Peace only works when the Robber is sitting on a tile where you have a Settlement or City.");
            return;
        }
        const fullCost = { lumber: 1, brick: 1, grain: 1, wool: 1, ore: 1 };
        const free = !firstUseDone.robberPeace;
        if (!free && !canAfford(fullCost, resources)) {
            setMsg("❌ Robber Peace costs one of every resource (Lumber, Brick, Grain, Wool, Ore) — you don't have enough.");
            return;
        }
        if (free) setFirstUseDone((prev) => ({ ...prev, robberPeace: true }));
        else pay(fullCost);
        setRobberHex("neutral");
        setMsg(
            free
                ? "🕊️ Robber Peace used for free this first time! After this, it costs one of every resource. The Robber slinks back to the Neutral Zone — once per turn only."
                : "🕊️ You paid one of every resource. The Robber slinks back to the Neutral Zone, off your land — once per turn only."
        );
    }

    function advanceSeason() {
        setSeason((prev) => (prev + 1) % 4);
        setDiceResult(null);
    }

    function rollDice() {
        const d1 = 1 + Math.floor(Math.random() * 6);
        const d2 = 1 + Math.floor(Math.random() * 6);
        const total = d1 + d2;
        const lines = [];
        const earned = {};

        if (total === 7) {
            lines.push("🎲 You rolled a 7! No tile produces this turn — time to move the Robber and check for discards.");
        } else if (season === 3 && (total === 2 || total === 12)) {
            lines.push("❄️ Winter Hardship! On a 2 or 12, normal production is skipped entirely and the Robber creeps toward the active hex.");
            const haveAny = Object.values(resources).some((v) => v > 0);
            if (haveAny) {
                const keys = Object.keys(resources).filter((k) => resources[k] > 0);
                const lose = keys[Math.floor(Math.random() * keys.length)];
                setResources((prev) => ({ ...prev, [lose]: Math.max(0, prev[lose] - 1) }));
                flash([lose]);
                lines.push(`You lose 1 ${lose} to the hardship.`);
            }
        } else {
            hexes.forEach((h) => {
                if (h.resource === "desert") return;
                let matches = h.number === total;
                let autumnBonus = false;
                if (season === 2 && (h.resource === "forest" || h.resource === "hills") && (total === 3 || total === 11)) {
                    matches = true;
                    autumnBonus = true;
                }
                if (robberHex === h.id) return; // blocked
                if (!matches) return;

                h.cornerIds.forEach((cid) => {
                    const b = buildings[cid];
                    if (!b || b.owner !== "you") return;
                    let base = b.level === "city" ? 2 : b.level === "settlement" ? 1 : 0;
                    if (base === 0) return;
                    if (season === 0 && (h.resource === "fields" || h.resource === "pasture") && (h.number === 6 || h.number === 8)) {
                        base += 1; // Spring fertility flat bonus
                    }
                    if (season === 1 && (h.number === 5 || h.number === 9)) {
                        base = base * 2; // Summer harvest doubles
                    }
                    const res = h.resource === "forest" ? "lumber" : h.resource === "hills" ? "brick" : h.resource === "fields" ? "grain" : h.resource === "pasture" ? "wool" : "ore";
                    earned[res] = (earned[res] || 0) + base;
                });
                if (autumnBonus) lines.push(`🍂 Autumn Abundance: the ${h.label} tile also produces on 3 and 11!`);
            });
            if (Object.keys(earned).length) {
                setResources((prev) => {
                    const next = { ...prev };
                    Object.keys(earned).forEach((r) => (next[r] += earned[r]));
                    return next;
                });
                flash(Object.keys(earned));
                lines.push("You collect: " + Object.keys(earned).map((r) => `+${earned[r]} ${r}`).join(", "));
            } else {
                lines.push("No resource lands on one of your buildings this roll.");
            }
        }

        setDiceResult({ d1, d2, total, lines });
    }

    const boardProps = { buildings, roads, robberHex, currentMode, resources, onCornerClick, onEdgeClick, onHexClick };

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(20,14,6,0.55)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                padding: "16px",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="alm-scope"
                style={{
                    width: "min(1180px, 100%)",
                    maxHeight: "94vh",
                    overflow: "auto",
                    borderRadius: "10px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                }}
            >
                <style>{ALMANAC_CSS}</style>
                <div className="alm-book">
                    <div className="alm-topbar">
                        <div className="alm-brand">
                            <span className="alm-seal">🏝️</span> Island Almanac
                        </div>
                        <div className="alm-resources">
                            {Object.keys(resources).map((k) => (
                                <div key={k} className={`alm-res-chip ${flashKeys.includes(k) ? "alm-flash" : ""}`}>
                                    {RES_ICON[k]} {resources[k]}
                                </div>
                            ))}
                        </div>
                        <div className="alm-vp-badge">
                            Victory Points: <b>{vp}</b> / 10
                        </div>
                        <button className="alm-close-btn" onClick={onClose} aria-label="Close tutorial">
                            ✕
                        </button>
                    </div>

                    <div className="alm-layout">
                        <div className="alm-tabs">
                            {CHAPTERS.map((c) => (
                                <button key={c.id} className={`alm-tab ${c.id === currentTab ? "alm-active" : ""}`} onClick={() => setCurrentTab(c.id)}>
                                    <span className="alm-ic">{c.icon}</span>
                                    {c.label}
                                </button>
                            ))}
                        </div>

                        <div className="alm-page">
                            {currentTab === "toc" && (
                                <>
                                    <div className="alm-toc-hero">
                                        <div className="alm-chapter-eyebrow">Welcome, Islander</div>
                                        <h2>The Island Almanac</h2>
                                        <p>
                                            Reach <b>10 Victory Points</b> before anyone else and the island is yours. Points come from Settlements, Cities, Resorts, the
                                            Longest Road, and the Largest Army. This guide focuses on the hands-on mechanics — the ones you'll actually click, place, and
                                            roll. Pick a chapter below, or use the shelf on the left.
                                        </p>
                                    </div>
                                    <div className="alm-toc-grid">
                                        {CHAPTERS.filter((c) => c.id !== "toc").map((c, i) => (
                                            <div key={c.id} className="alm-toc-item" onClick={() => setCurrentTab(c.id)}>
                                                <div className="alm-n">Chapter {ROMAN[i]}</div>
                                                <div className="alm-t">
                                                    {c.icon} {c.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {currentTab === "roads" && (
                                <>
                                    <div className="alm-chapter-eyebrow">Chapter I</div>
                                    <div className="alm-chapter-title">
                                        <span className="alm-em">🛣️</span>Roads
                                    </div>
                                    <div className="alm-content-grid">
                                        <div className="alm-info-col">
                                            <p className="alm-lead">
                                                Roads connect your territory. Every road must touch one of your existing roads, Settlements, or Cities — you can't build in
                                                isolation.
                                            </p>
                                            <div className="alm-card">
                                                <b>Cost</b>
                                                <CostPills cost={COSTS.road} />
                                                A road may never be built through another player's Settlement or City.
                                            </div>
                                            <div className="alm-card">
                                                Try it: click any glowing edge on the map to lay your first road, then keep extending your network from there.
                                            </div>
                                            <div className="alm-message-box">{msg}</div>
                                        </div>
                                        <div className="alm-board-col">
                                            <Board {...boardProps} />
                                            <Legend />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentTab === "settlements" && (
                                <>
                                    <div className="alm-chapter-eyebrow">Chapter II</div>
                                    <div className="alm-chapter-title">
                                        <span className="alm-em">🏠</span>Settlements
                                    </div>
                                    <div className="alm-content-grid">
                                        <div className="alm-info-col">
                                            <p className="alm-lead">Settlements come in two flavors depending on when you place them.</p>
                                            <div className="alm-toggle-row">
                                                <div className={`alm-toggle ${sMode === "setup" ? "alm-active" : ""}`} onClick={() => setSMode("setup")}>
                                                    Setup Phase — Free
                                                </div>
                                                <div className={`alm-toggle ${sMode === "build" ? "alm-active" : ""}`} onClick={() => setSMode("build")}>
                                                    Building Phase — Costs Resources
                                                </div>
                                            </div>
                                            <div className="alm-card">
                                                {sMode === "setup" ? (
                                                    <>
                                                        <b>Setup Placement</b>
                                                        <br />
                                                        At the start of the game, your first two Settlements are free. The Distance Rule still applies — you can't place
                                                        one right next to another Settlement or City. After your second Settlement, you collect starting resources from
                                                        its adjacent tiles.
                                                    </>
                                                ) : (
                                                    <>
                                                        <b>Building Phase</b>
                                                        <br />
                                                        Every Settlement after setup must be connected to one of your Roads and follow the Distance Rule.
                                                        <CostPills cost={COSTS.settlement} />
                                                    </>
                                                )}
                                            </div>
                                            <div className="alm-message-box">{msg}</div>
                                        </div>
                                        <div className="alm-board-col">
                                            <Board {...boardProps} />
                                            <Legend />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentTab === "cities" && (
                                <>
                                    <div className="alm-chapter-eyebrow">Chapter III</div>
                                    <div className="alm-chapter-title">
                                        <span className="alm-em">🏙️</span>Cities
                                    </div>
                                    <div className="alm-content-grid">
                                        <div className="alm-info-col">
                                            <p className="alm-lead">A City is a Settlement that's leveled up — it replaces the Settlement on the same spot and produces double.</p>
                                            <div className="alm-card">
                                                <b>Cost</b>
                                                <CostPills cost={COSTS.city} />
                                                A Settlement produces 1 resource per roll; a City produces 2. Worth 2 Victory Points instead of 1.
                                            </div>
                                            <div className="alm-card">Need a Settlement to upgrade first. Head to Chapter II if your map doesn't have one of your own yet.</div>
                                            <div className="alm-message-box">{msg}</div>
                                        </div>
                                        <div className="alm-board-col">
                                            <Board {...boardProps} />
                                            <Legend />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentTab === "robber" && (
                                <>
                                    <div className="alm-chapter-eyebrow">Chapter IV</div>
                                    <div className="alm-chapter-title">
                                        <span className="alm-em">🏴</span>The Robber
                                    </div>
                                    <div className="alm-content-grid">
                                        <div className="alm-info-col">
                                            <p className="alm-lead">
                                                Roll a 7 and the Robber wakes up: no tile produces that turn, players with more than 7 cards discard half, and you move
                                                the Robber onto a tile of your choice — blocking it and letting you steal a card from anyone settled there.
                                            </p>
                                            <div className="alm-card">
                                                <b>🕊️ Robber Peace</b>
                                                <br />
                                                If the Robber lands on a tile where you have a Settlement or City, you may pay one of every resource, once per turn, to
                                                send it straight to the Neutral Zone.
                                                <CostPills cost={{ lumber: 1, brick: 1, grain: 1, wool: 1, ore: 1 }} />
                                                <button className="alm-btn alm-secondary" onClick={robberPeace}>
                                                    Pay &amp; Banish to Neutral Zone
                                                </button>
                                            </div>
                                            <div className="alm-message-box">{msg}</div>
                                        </div>
                                        <div className="alm-board-col">
                                            <Board {...boardProps} />
                                            <Legend />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentTab === "seasons" && (
                                <>
                                    <div className="alm-chapter-eyebrow">Chapter V</div>
                                    <div className="alm-chapter-title">
                                        <span className="alm-em">🌸</span>Seasons &amp; Special Rolls
                                    </div>
                                    <div className="alm-content-grid">
                                        <div className="alm-info-col">
                                            <p className="alm-lead">
                                                The Season Track shifts every 5 turns, or the moment someone claims the Largest Army. Each season bends how the dice
                                                behave.
                                            </p>
                                            <div className="alm-season-track">
                                                {SEASONS.map((s, i) => (
                                                    <div key={s.name} className={`alm-season-chip ${i === season ? "alm-current" : ""}`}>
                                                        {s.icon}
                                                        <br />
                                                        {s.name}
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="alm-btn alm-secondary" onClick={advanceSeason}>
                                                Advance to Next Season →
                                            </button>
                                            <div className="alm-card" style={{ marginTop: "12px" }}>
                                                <b>🌸 Spring — Fertility:</b> rolling 6 or 8 gives Fields &amp; Pastures +1 extra resource.
                                                <br />
                                                <b>☀️ Summer — Harvest:</b> rolling 5 or 9 doubles that tile's production.
                                                <br />
                                                <b>🍂 Autumn — Abundance:</b> Forests &amp; Hills also produce on 3 and 11.
                                                <br />
                                                <b>❄️ Winter — Hardship:</b> rolling 2 or 12 skips production and costs you a random resource.
                                            </div>
                                            <button className="alm-btn alm-gold" style={{ marginTop: "6px" }} onClick={rollDice}>
                                                🎲 Roll the Dice
                                            </button>
                                            {diceResult && (
                                                <>
                                                    <div className="alm-dice-result">
                                                        <div className="alm-die">{diceResult.d1}</div>
                                                        <div className="alm-die">{diceResult.d2}</div>
                                                        <div className="alm-total-badge">
                                                            Total: {diceResult.total} · {SEASONS[season].name}
                                                        </div>
                                                    </div>
                                                    <div className="alm-message-box">
                                                        {diceResult.lines.map((l, i) => (
                                                            <span key={i}>
                                                                {l}
                                                                <br />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="alm-board-col">
                                            <Board {...boardProps} />
                                            <Legend />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentTab === "resort" && (
                                <>
                                    <div className="alm-chapter-eyebrow">Chapter VI</div>
                                    <div className="alm-chapter-title">
                                        <span className="alm-em">🏝️</span>The Resort
                                    </div>
                                    <div className="alm-content-grid">
                                        <div className="alm-info-col">
                                            <p className="alm-lead">
                                                A Resort lets you seize an opponent's City outright. Their City is removed, your Resort takes its place, and they lose
                                                the Victory Points that City was worth. A Resort can never be built over or replaced.
                                            </p>
                                            <div className="alm-card">
                                                <b>Cost</b>
                                                <CostPills cost={COSTS.resort} />
                                                Can only overtake a City — never a plain Settlement.
                                            </div>
                                            <div className="alm-card">The maroon marker on the map is a rival's City. Try taking it.</div>
                                            <div className="alm-message-box">{msg}</div>
                                        </div>
                                        <div className="alm-board-col">
                                            <Board {...boardProps} />
                                            <Legend />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------------------------------------------------------
   CSS (ported 1:1 from the original stylesheet, scoped and
   prefixed with "alm-" so it never collides with app styles)
--------------------------------------------------------- */
const ALMANAC_CSS = `
.alm-scope{
  --parchment: #E8D8AF;
  --parchment-dark: #D8C28C;
  --parchment-shadow: #B89C63;
  --wood-dark: #3C2415;
  --wood-mid: #5E3A22;
  --wood-light: #85582F;
  --ink: #3A2A16;
  --ink-soft: #6B5636;
  --gold: #A9791F;
  --gold-bright: #D4A72C;
  --wax: #8B3324;
  --wax-bright: #B14432;
  --lumber: #3E5C3A;
  --brick: #A34E2C;
  --grain: #C79A2A;
  --wool: #8E9E6E;
  --ore: #5C6570;
  font-family: Georgia, 'Palatino Linotype', 'Book Antiqua', serif;
  color: var(--ink);
}
.alm-scope *{box-sizing:border-box;}
.alm-scope h1,.alm-scope h2,.alm-scope h3{font-family: Georgia, serif; letter-spacing:0.5px; margin:0 0 6px 0; color:var(--ink);}
.alm-book{
  max-width:1180px;
  margin:0 auto;
  background:
    radial-gradient(ellipse at top left, rgba(255,255,255,0.05), transparent 60%),
    repeating-linear-gradient(115deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 2px, transparent 2px, transparent 7px),
    linear-gradient(160deg, var(--wood-mid), var(--wood-dark) 70%);
  border-radius:10px;
  padding:16px;
}
.alm-topbar{
  display:flex; align-items:center; justify-content:space-between;
  gap:16px; flex-wrap:wrap;
  padding:12px 18px;
  margin-bottom:14px;
  background: linear-gradient(180deg, var(--wood-light), var(--wood-mid));
  border-radius:8px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 3px 8px rgba(0,0,0,0.4);
}
.alm-brand{
  color: var(--parchment);
  font-size:1.15rem;
  letter-spacing:1.5px;
  text-transform:uppercase;
  font-weight:bold;
  display:flex; align-items:center; gap:10px;
}
.alm-brand .alm-seal{
  width:30px;height:30px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%, var(--wax-bright), var(--wax) 70%);
  box-shadow:0 0 0 2px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.5);
  display:flex;align-items:center;justify-content:center;
  font-size:14px;
}
.alm-vp-badge{
  color:var(--parchment); font-size:0.85rem; display:flex; align-items:center; gap:8px;
  background:rgba(0,0,0,0.25); padding:6px 12px; border-radius:20px;
}
.alm-vp-badge b{color:var(--gold-bright); font-size:1.1rem;}
.alm-resources{
  display:flex; gap:6px; flex-wrap:wrap;
}
.alm-res-chip{
  display:flex; align-items:center; gap:5px;
  background:rgba(0,0,0,0.25);
  color:var(--parchment);
  padding:4px 9px;
  border-radius:14px;
  font-size:0.82rem;
  transition: background 0.3s;
}
.alm-res-chip.alm-flash{ background: rgba(212,167,44,0.55); }
.alm-close-btn{
  font-family:Georgia, serif;
  background: rgba(0,0,0,0.3);
  color: var(--parchment);
  border: 1px solid rgba(255,255,255,0.15);
  width:32px; height:32px;
  border-radius:50%;
  cursor:pointer;
  font-size:0.95rem;
  line-height:1;
  transition: background 0.15s;
}
.alm-close-btn:hover{ background: rgba(0,0,0,0.5); }
.alm-layout{
  display:flex; gap:14px;
}
.alm-tabs{
  display:flex; flex-direction:column; gap:8px; width:130px; flex-shrink:0;
}
.alm-tab{
  background: linear-gradient(180deg, #6b4226, #4a2c17);
  color:var(--parchment-dark);
  border:none;
  padding:12px 8px;
  border-radius:4px 10px 10px 4px;
  cursor:pointer;
  text-align:left;
  font-family:Georgia, serif;
  font-size:0.82rem;
  letter-spacing:0.4px;
  box-shadow: 2px 3px 6px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05);
  transition: transform 0.15s, background 0.2s;
  display:flex; align-items:center; gap:7px;
}
.alm-tab .alm-ic{font-size:1rem;}
.alm-tab:hover{ transform: translateX(3px); }
.alm-tab.alm-active{
  background: linear-gradient(180deg, var(--gold-bright), var(--gold));
  color: var(--wood-dark);
  font-weight:bold;
  transform: translateX(5px);
}
.alm-page{
  flex:1;
  background:
    radial-gradient(ellipse at 15% 10%, rgba(255,255,255,0.25), transparent 40%),
    linear-gradient(180deg, var(--parchment), var(--parchment-dark));
  border-radius:6px;
  box-shadow: inset 0 0 40px rgba(120,90,40,0.35), 0 6px 18px rgba(0,0,0,0.4);
  padding:22px 26px;
  min-height:560px;
  position:relative;
}
.alm-page::before{
  content:"";
  position:absolute; inset:8px;
  border:1px solid rgba(90,60,25,0.35);
  border-radius:3px;
  pointer-events:none;
}
.alm-chapter-eyebrow{
  text-transform:uppercase; letter-spacing:2px; font-size:0.72rem;
  color:var(--wax); font-weight:bold; margin-bottom:2px;
}
.alm-chapter-title{
  font-size:1.7rem; color:var(--ink); border-bottom:2px solid rgba(90,60,25,0.3);
  padding-bottom:8px; margin-bottom:12px;
}
.alm-chapter-title .alm-em{font-size:1.3rem; margin-right:6px;}
.alm-lead{ color:var(--ink-soft); font-size:0.95rem; line-height:1.5; margin:0 0 12px 0;}
.alm-content-grid{ display:flex; gap:20px; flex-wrap:wrap; }
.alm-info-col{ flex: 1 1 300px; min-width:260px; }
.alm-board-col{ flex: 1 1 380px; display:flex; flex-direction:column; align-items:center; }
.alm-card{
  background:rgba(255,255,255,0.35);
  border:1px solid rgba(90,60,25,0.25);
  border-radius:8px;
  padding:12px 14px;
  margin-bottom:12px;
  font-size:0.87rem;
  line-height:1.5;
}
.alm-card b{color:var(--wax);}
.alm-cost-line{ display:flex; gap:8px; flex-wrap:wrap; margin:6px 0; }
.alm-cost-pill{
  padding:3px 9px; border-radius:12px; font-size:0.78rem; color:white; font-weight:bold;
}
.alm-btn{
  font-family:Georgia, serif;
  background: linear-gradient(180deg, var(--wax-bright), var(--wax));
  color:#fff; border:none; padding:9px 16px; border-radius:20px;
  cursor:pointer; font-size:0.85rem; letter-spacing:0.3px;
  box-shadow:0 3px 6px rgba(0,0,0,0.3);
  transition:transform 0.1s;
}
.alm-btn:hover{ transform:translateY(-1px); }
.alm-btn:active{ transform:translateY(1px); }
.alm-btn.alm-secondary{ background: linear-gradient(180deg, #8B7042, #6b5330); }
.alm-btn.alm-gold{ background: linear-gradient(180deg, var(--gold-bright), var(--gold)); color:var(--wood-dark); }
.alm-toggle-row{ display:flex; gap:8px; margin-bottom:14px; }
.alm-toggle{
  flex:1; padding:9px 8px; text-align:center; border-radius:6px; cursor:pointer;
  font-size:0.8rem; border:1px solid rgba(90,60,25,0.35); background:rgba(255,255,255,0.3);
  transition: all 0.15s;
}
.alm-toggle.alm-active{ background: var(--gold-bright); font-weight:bold; border-color: var(--gold); }
.alm-message-box{
  min-height:44px; margin-top:10px; padding:9px 12px; border-radius:6px;
  background:rgba(60,36,21,0.08); font-size:0.85rem; color:var(--ink);
  border-left:3px solid var(--wax);
}
.alm-board-svg{ background: radial-gradient(ellipse at center, #7fa8c9, #5f89ab 70%); border-radius:10px; box-shadow: inset 0 0 0 6px var(--wood-mid), 0 4px 10px rgba(0,0,0,0.4);}
.alm-hex{ cursor:default; }
.alm-hex.alm-clickable{ cursor:pointer; }
.alm-corner-dot{ cursor:default; }
.alm-corner-dot.alm-clickable{ cursor:pointer; }
.alm-corner-dot.alm-valid{ animation: alm-pulse 1.2s infinite; }
.alm-edge-line{ cursor:default; }
.alm-edge-line.alm-clickable{ cursor:pointer; }
.alm-edge-line.alm-valid{ animation: alm-pulseLine 1.2s infinite; }
@keyframes alm-pulse{ 0%,100%{ opacity:0.65;} 50%{opacity:1;} }
@keyframes alm-pulseLine{ 0%,100%{ opacity:0.5;} 50%{opacity:0.95;} }
.alm-legend{ display:flex; gap:14px; flex-wrap:wrap; margin-top:10px; font-size:0.75rem; color:var(--ink-soft); justify-content:center;}
.alm-legend span{ display:inline-flex; align-items:center; gap:4px; }
.alm-swatch{ width:11px;height:11px;border-radius:3px; display:inline-block; }
.alm-season-track{ display:flex; gap:8px; margin-bottom:12px; }
.alm-season-chip{
  flex:1; text-align:center; padding:10px 4px; border-radius:8px; font-size:0.78rem;
  background:rgba(255,255,255,0.3); border:1px solid rgba(90,60,25,0.25); opacity:0.5;
}
.alm-season-chip.alm-current{ opacity:1; background:var(--gold-bright); font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.2); }
.alm-dice-result{ display:flex; align-items:center; gap:10px; margin:10px 0; }
.alm-die{
  width:36px;height:36px; background:#fff8ea; border:2px solid var(--ink); border-radius:6px;
  display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.1rem; color:var(--ink);
  box-shadow:0 2px 3px rgba(0,0,0,0.3);
}
.alm-total-badge{
  background:var(--wood-dark); color:var(--parchment); padding:6px 14px; border-radius:20px; font-weight:bold;
}
.alm-toc-hero{ text-align:center; padding:10px 10px 20px; }
.alm-toc-hero h2{ font-size:2rem; margin-bottom:6px; }
.alm-toc-hero p{ max-width:560px; margin:0 auto 18px; color:var(--ink-soft); line-height:1.6; }
.alm-toc-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; max-width:640px; margin:0 auto; }
.alm-toc-item{
  background:rgba(255,255,255,0.35); border:1px solid rgba(90,60,25,0.25);
  border-radius:8px; padding:12px; text-align:left; cursor:pointer; transition: transform 0.15s;
}
.alm-toc-item:hover{ transform:translateY(-2px); background:rgba(255,255,255,0.55); }
.alm-toc-item .alm-n{ font-size:0.7rem; text-transform:uppercase; letter-spacing:1.5px; color:var(--wax); }
.alm-toc-item .alm-t{ font-weight:bold; margin-top:2px; }
@media (max-width:820px){
  .alm-layout{ flex-direction:column; }
  .alm-tabs{ flex-direction:row; overflow-x:auto; width:100%; }
  .alm-tab{ white-space:nowrap; }
  .alm-toc-grid{ grid-template-columns:1fr; }
}
`;
