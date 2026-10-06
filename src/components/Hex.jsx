import { useState } from "react";
import desertimg from "../../images/desert.png";
import fieldsimg from "../../images/field.png";
import forestimg from "../../images/forest.png";
import hillsimg from "../../images/hills.png";
import mountainsimg from "../../images/mountain.png";
import pastureimg from "../../images/pasture.png";
import robberimg from "../../images/robber.png";
import { useTranslation } from "../i18n.js";

const images = {
    hills: hillsimg,
    forest: forestimg,
    fields: fieldsimg,
    pasture: pastureimg,
    mountains: mountainsimg,
    desert: desertimg,
    Robber: robberimg,
};

const HEX_POINTS = "50,0 100,25 100,75 50,100 0,75 0,25";

// Tiny deterministic hash so hexes that go under in the same tide don't all
// start in perfect unison (0 / 0.12 / 0.24 / 0.36 s).
function floodStagger(id) {
    let h = 0;
    for (let i = 0; i < String(id).length; i++) h = (h * 31 + String(id).charCodeAt(i)) % 997;
    return (h % 4) * 0.12;
}

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

/**
 * Optional props (all default to "off", so existing callers are unaffected):
 *  hexFilter   CSS filter for the terrain art only (board theme)
 *  claimColor  colour of the player who drafted this hex (Draft mode)
 *  highlighted pulse outline (e.g. hovering a hex card in the draft)
 *  pending     this hex floods at the next tide (Shrinking mode)
 */
export default function Hex({ hex, G, moves, width, height, hexFilter, claimColor, highlighted, pending }) {
    const { t } = useTranslation();
    const flooded = Boolean(hex.flooded);

    // "Sinking" = this hex went under while we were watching. We detect the
    // false -> true change while rendering (no effect / timer needed): a hex that
    // is already flooded on first render (e.g. after a reload) just shows the
    // settled state and never plays the animation.
    const [wasFlooded, setWasFlooded] = useState(flooded);
    const [sinkRun, setSinkRun] = useState(0);
    if (flooded !== wasFlooded) {
        setWasFlooded(flooded);
        if (flooded) setSinkRun((n) => n + 1);
    }
    const sinking = sinkRun > 0;
    const floodVars = { "--flood-delay": `${floodStagger(hex.id)}s` };
    const outline = highlighted
        ? { color: "#ffe066", dash: undefined, w: 5 }
        : pending && !flooded
            ? { color: "#ff6b4a", dash: "6 4", w: 4 }
            : claimColor
                ? { color: claimColor, dash: undefined, w: 4 }
                : null;

    return (
        <div
            data-hex-id={hex.id}
            data-flooded={flooded ? "true" : undefined}
            style={{
                position: "absolute",
                left: `${hex.x}px`,
                top: `${hex.y}px`,
                width: `${width}px`,
                height: `${height}px`,
                transform: "translate(-50%, -50%)",
                ...floodVars,
            }}
        >
            <div
                key={`q${sinkRun}`}
                className={sinking ? "hex-quake" : undefined}
                style={{
                    width: "100%",
                    height: "100%",
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                }}
            >
                <div
                    className={sinking ? "hex-sink-terrain" : undefined}
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${images[hex.terrain]})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: flooded ? "grayscale(0.9) brightness(0.55)" : hexFilter && hexFilter !== "none" ? hexFilter : undefined,
                    }}
                />

                {flooded && (
                    <div className="hex-flooded" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                        <div
                            key={`w${sinkRun}`}
                            className={sinking ? "hex-water-rise" : undefined}
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(160deg, rgba(40,120,200,0.82), rgba(10,50,110,0.9))",
                            }}
                        >
                            {sinking && (
                                <svg
                                    className="hex-wave"
                                    viewBox="0 0 100 12"
                                    preserveAspectRatio="none"
                                    style={{ position: "absolute", left: "-50%", top: "-11px", width: "200%", height: "12px" }}
                                >
                                    <path d="M0 6 Q12.5 0 25 6 T50 6 T75 6 T100 6 V12 H0 Z" fill="rgba(60,140,215,0.9)" />
                                </svg>
                            )}
                        </div>
                        <div
                            className={sinking ? "hex-flood-label" : undefined}
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                color: "#d8efff",
                                fontWeight: "bold",
                                fontSize: "0.7rem",
                                textShadow: "0 1px 2px #000",
                            }}
                        >
                            <span style={{ fontSize: "1.6rem" }}>🌊</span>
                            {t("hexFlooded")}
                        </div>
                    </div>
                )}

                {outline && (
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className={highlighted || pending ? "hex-outline-pulse" : undefined}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}
                    >
                        <polygon
                            points={HEX_POINTS}
                            fill={pending && !highlighted ? "rgba(255,80,40,0.16)" : "none"}
                            stroke={outline.color}
                            strokeWidth={outline.w}
                            strokeDasharray={outline.dash}
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                )}

                {!flooded && claimColor && (
                    <span
                        title={t("hexClaimed")}
                        style={{
                            position: "absolute",
                            top: "9%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: claimColor,
                            border: "2px solid #fff",
                            fontSize: "0.6rem",
                            lineHeight: "12px",
                            textAlign: "center",
                            color: "#fff",
                            zIndex: 3,
                        }}
                    >
                        ⚑
                    </span>
                )}

                {pending && !flooded && (
                    <span
                        title={t("hexFloodsNext")}
                        style={{ position: "absolute", bottom: "9%", left: "50%", transform: "translateX(-50%)", fontSize: "1rem", zIndex: 3 }}
                    >
                        🌊
                    </span>
                )}

                {(!flooded || sinking) && (
                    <span
                        className={flooded ? "hex-token-sink" : undefined}
                        style={{ position: "relative", zIndex: 1, fontWeight: "bold", fontSize: "0.8rem", color: "white", textShadow: "1px 1px 2px black" }}
                    >
                        {hex.terrain}
                    </span>
                )}

                {(!flooded || sinking) && hex.number && (
                    <div className={flooded ? "hex-token-sink" : undefined} style={{ position: "relative", zIndex: 1, background: "white", color: "black", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "5px", fontWeight: "bold", border: "1px solid #333" }}>
                        {hex.number}
                    </div>
                )}

                {G.board.robberPosition === hex.id && <Robber />}

                {!flooded && G.isRobberPlacing && G.board.robberPosition !== hex.id && (
                    <button
                        onClick={(e) => { e.stopPropagation(); moves.placeRobber(hex.id); }}
                        style={{ position: "absolute", zIndex: 150, backgroundColor: "red", color: "white", border: "none", borderRadius: "5px", padding: "5px", fontWeight: "bold", cursor: "pointer" }}
                    >
                        PLACE
                    </button>
                )}
            </div>

            {sinking && (
                <svg
                    key={`r${sinkRun}`}
                    className="hex-ripple"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
                >
                    <polygon points={HEX_POINTS} fill="none" stroke="#bfe6ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
            )}
        </div>
    );
}