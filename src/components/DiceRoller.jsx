import { useEffect, useRef, useState } from "react";

const PIPS = {
    1: [[50, 50]],
    2: [[27, 27], [73, 73]],
    3: [[27, 27], [50, 50], [73, 73]],
    4: [[27, 27], [73, 27], [27, 73], [73, 73]],
    5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
    6: [[27, 24], [73, 24], [27, 50], [73, 50], [27, 76], [73, 76]],
};

function splitRoll(sum) {
    if (!sum || sum < 2) return [1, 1];
    let a = Math.min(6, sum - 1);
    let b = sum - a;
    if (b < 1) {
        b = 1;
        a = sum - 1;
    }
    return [a, b];
}

function DieFace({ value, size = 60, spinning }) {
    const pips = PIPS[value] || PIPS[1];
    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            style={{
                display: "block",
                filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.5))",
                transition: spinning ? "none" : "transform 0.15s ease-out",
            }}
        >
            <defs>
                <linearGradient id="dieFace" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fdf6e3" />
                    <stop offset="100%" stopColor="#e8dcb8" />
                </linearGradient>
            </defs>
            <rect
                x="4"
                y="4"
                width="92"
                height="92"
                rx="16"
                fill="url(#dieFace)"
                stroke="#4a3210"
                strokeWidth="4"
            />
            {pips.map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="8.5" fill="#2c1e0e" />
            ))}
        </svg>
    );
}

const GROUP_ORDER = [7, 6, 5, 4, 3, 2, 11, 12, 10, 9, 8];

const SLICE_DEGREES = 360 / GROUP_ORDER.length;
const WHEEL_SLICES = GROUP_ORDER.map((value, i) => {
    const start = i * SLICE_DEGREES;
    const end = start + SLICE_DEGREES;
    return { value, start, end, mid: start + SLICE_DEGREES / 2 };
});

const GROUP_COLORS = {
    7: "#a3391f",
    6: "#8a5a20", 5: "#c9922f", 4: "#8a5a20", 3: "#c9922f", 2: "#8a5a20",
    11: "#c9922f", 12: "#8a5a20", 10: "#c9922f", 9: "#8a5a20", 8: "#c9922f",
};

function polarPoint(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sliceArcPath(cx, cy, r, startAngle, endAngle) {
    const start = polarPoint(cx, cy, r, endAngle);
    const end = polarPoint(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function bestSliceForValue(value) {
    return WHEEL_SLICES.find((s) => s.value === value) || null;
}

function rotationForValue(value, spins) {
    const slice = bestSliceForValue(value);
    if (!slice) return 0;
    return spins * 360 * 3 + (360 - slice.mid);
}

function SpinWheel({ value, spinTrigger, size = 130 }) {
    const [rotation, setRotation] = useState(() => rotationForValue(value, 0));
    const spinsRef = useRef(0);

    useEffect(() => {
        if (!value) return;
        spinsRef.current += 1;
        setRotation(rotationForValue(value, spinsRef.current));
    }, [spinTrigger, value]);

    const cx = 50, cy = 50, r = 48;

    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <div
                style={{
                    position: "absolute",
                    top: "-6px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: "11px solid #f1d38a",
                    zIndex: 2,
                    filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))",
                }}
            />
            <svg
                viewBox="0 0 100 100"
                width={size}
                height={size}
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: "transform 1.8s cubic-bezier(0.15,0.8,0.25,1)",
                    filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))",
                    display: "block",
                }}
            >
                <circle cx={cx} cy={cy} r={r + 1} fill="#2c1e0e" />
                {WHEEL_SLICES.map((s) => (
                    <path
                        key={s.value}
                        d={sliceArcPath(cx, cy, r, s.start, s.end)}
                        fill={GROUP_COLORS[s.value]}
                        stroke="#2c1e0e"
                        strokeWidth="1"
                    />
                ))}
                {WHEEL_SLICES.map((s) => {
                    const pos = polarPoint(cx, cy, r * 0.72, s.mid);
                    return (
                        <text
                            key={s.value}
                            x={pos.x}
                            y={pos.y}
                            fontSize="10"
                            fill="white"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            {s.value}
                        </text>
                    );
                })}
                <circle cx={cx} cy={cy} r="6" fill="#f1d38a" stroke="#2c1e0e" strokeWidth="1.5" />
            </svg>
        </div>
    );
}

export default function DiceRoller({ G, ctx, moves, playerID }) {
    const diceMode = G.settings?.diceMode || "standard";
    const [faces, setFaces] = useState([1, 1]);
    const [spinning, setSpinning] = useState(false);
    const [wheelSpinTrigger, setWheelSpinTrigger] = useState(0);
    const intervalRef = useRef(null);
    const prevRolledRef = useRef(G.diceRolled);

    const isMyTurn = playerID === undefined || ctx.currentPlayer === playerID;
    const canRoll = !G.diceRolled && isMyTurn && ctx.phase !== "setup";

    useEffect(() => {
        const justRolled = G.diceRolled && !prevRolledRef.current;
        prevRolledRef.current = G.diceRolled;

        if (diceMode === "wheel") {
            if (justRolled && G.diceValue) {
                setWheelSpinTrigger((t) => t + 1);
            }
            return;
        }

        if (justRolled && G.diceValue) {
            setSpinning(true);
            let ticks = 0;
            intervalRef.current = setInterval(() => {
                ticks += 1;
                setFaces([
                    1 + Math.floor(Math.random() * 6),
                    1 + Math.floor(Math.random() * 6),
                ]);
                if (ticks >= 8) {
                    clearInterval(intervalRef.current);
                    setFaces(splitRoll(G.diceValue));
                    setSpinning(false);
                }
            }, 80);
        } else if (G.diceValue && !spinning) {
            setFaces(splitRoll(G.diceValue));
        }

        return () => clearInterval(intervalRef.current);
    }, [G.diceRolled, G.diceValue, diceMode]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                pointerEvents: "auto",
            }}
        >
            {diceMode === "wheel" ? (
                <SpinWheel value={G.diceValue} spinTrigger={wheelSpinTrigger} />
            ) : (
                <div style={{ display: "flex", gap: "10px" }}>
                    {faces.map((f, i) => (
                        <div
                            key={i}
                            className={spinning ? "dice-spin" : ""}
                            style={{ width: 60, height: 60 }}
                        >
                            <DieFace value={f} spinning={spinning} />
                        </div>
                    ))}
                </div>
            )}

            <button
                disabled={!canRoll}
                onClick={() => moves.rollDice()}
                title={
                    ctx.phase === "setup"
                        ? "Finish setup first"
                        : !isMyTurn
                            ? "Not your turn"
                            : G.diceRolled
                                ? "Already rolled this turn"
                                : diceMode === "wheel"
                                    ? "Spin the wheel"
                                    : "Roll the dice"
                }
                style={{
                    padding: "6px 18px",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    letterSpacing: "0.5px",
                    fontFamily: "Georgia, serif",
                    color: "white",
                    background: canRoll
                        ? "linear-gradient(135deg, #8a5a20, #c9922f)"
                        : "#4a4a4a",
                    border: `2px solid ${canRoll ? "#f1d38a" : "#666"}`,
                    borderRadius: "20px",
                    cursor: canRoll ? "pointer" : "not-allowed",
                    opacity: canRoll ? 1 : 0.6,
                    boxShadow: canRoll ? "0 3px 8px rgba(0,0,0,0.4)" : "none",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.6)",
                }}
            >
                {diceMode === "wheel" ? "🎡" : "🎲"} {G.diceRolled ? `Rolled ${G.diceValue}` : diceMode === "wheel" ? "Spin" : "Roll"}
            </button>
        </div>
    );
}
