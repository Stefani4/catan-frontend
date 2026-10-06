import { memo, useId, useMemo } from "react";

// ---------------------------------------------------------------------------
// Animated board-theme backdrops.
//
// Rendered as the FIRST child of a stacking context (the board root / a shop
// preview) with z-index:-1, so it sits above that element's own background but
// below everything else — it can never cover game UI, and it ignores pointer
// events. Everything is CSS transforms/opacity (cheap), and sizes/distances use
// container-query units (cqw / cqh / cqmin) so the very same animation works
// full-screen on the board and miniaturised in the shop preview.
//
// Particle layouts come from a seeded PRNG, so they are identical on every
// render (no jumping when the board re-renders) and in tests.
// ---------------------------------------------------------------------------

function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const range = (r, a, b) => a + r() * (b - a);
const pick = (r, list) => list[Math.floor(r() * list.length)];
const seedOf = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

/** `count` particles (scaled by density) built by `make(r, i)`. */
function useParticles(name, count, density, make) {
    return useMemo(() => {
        const r = mulberry32(seedOf(name));
        return Array.from({ length: Math.max(1, Math.round(count * density)) }, (_, i) => make(r, i));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, count, density]);
}

// A negative delay starts every particle mid-flight, so the scene is "already
// running" the moment it appears instead of everything spawning together.
const timing = (r, dur) => ({ "--dur": `${dur.toFixed(1)}s`, "--delay": `${(-r() * dur).toFixed(1)}s` });

function Particles({ items, className }) {
    return items.map((style, i) => <i key={i} className={`bd-p ${className}`} style={style} />);
}

/* ------------------------------ Parchment Map ------------------------------ */
function Parchment({ density }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    const motes = useParticles("parch-motes", 16, density, (r) => ({
        left: `${range(r, 2, 98)}%`, ...timing(r, range(r, 20, 36)), "--dx": `${range(r, -6, 6)}cqw`,
    }));
    const squiggles = useParticles("parch-squiggles", 9, density, (r) => ({
        left: `${range(r, 3, 62)}%`, top: `${range(r, 62, 93)}%`, "--delay": `${(-r() * 4).toFixed(1)}s`, "--dur": `${range(r, 3, 5).toFixed(1)}s`,
    }));
    return (
        <>
            <svg className="bd-fill" aria-hidden="true">
                <filter id={`paper${uid}`} x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="4" />
                    <feColorMatrix values="0 0 0 0 0.36  0 0 0 0 0.24  0 0 0 0 0.08  0 0 0 0.55 0" />
                </filter>
                <rect width="100%" height="100%" filter={`url(#paper${uid})`} opacity="0.35" />
            </svg>
            <div className="bd-fill bd-parch-vignette" />
            <div className="bd-fill bd-parch-glow" />

            <svg className="bd-compass" viewBox="-50 -50 100 100" aria-hidden="true">
                <g fill="none" stroke="#5a3a12" strokeWidth="1">
                    <circle r="44" /><circle r="38" strokeDasharray="1.5 2.5" /><circle r="12" />
                    {Array.from({ length: 16 }, (_, i) => (
                        <line key={i} x1="0" y1="-44" x2="0" y2={i % 2 ? -41 : -38} transform={`rotate(${i * 22.5})`} />
                    ))}
                </g>
                <path d="M0 -42 L6 -6 L42 0 L6 6 L0 42 L-6 6 L-42 0 L-6 -6Z" fill="#5a3a12" opacity="0.55" />
                <path d="M0 -30 L4 -4 L30 0 L4 4 L0 30 L-4 4 L-30 0 L-4 -4Z" transform="rotate(45)" fill="#8a5a1f" opacity="0.5" />
                <text y="-46" fontSize="9" textAnchor="middle" fill="#5a3a12" fontFamily="Georgia, serif">N</text>
            </svg>

            <svg className="bd-fill" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
                <path className="bd-route" d="M4 47 C 20 30, 30 56, 46 38 S 74 14, 93 22" />
            </svg>
            <svg className="bd-x" style={{ left: "93%", top: "36%" }} viewBox="-10 -10 20 20" aria-hidden="true">
                <path d="M-7 -7 L7 7 M7 -7 L-7 7" stroke="#8a1c1c" strokeWidth="3" strokeLinecap="round" />
            </svg>

            {[["70%", 46, -8], ["84%", 70, -38]].map(([top, dur, delay]) => (
                <div key={top} className="bd-p bd-ship" style={{ "--top": top, "--dur": `${dur}s`, "--delay": `${delay}s` }}>
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M4 21h24l-4 6H8z" fill="#4a2f0f" />
                        <path d="M16 4v17" stroke="#4a2f0f" strokeWidth="1.5" />
                        <path d="M17 5l9 14h-9z" fill="#7a5320" />
                        <path d="M15 8L8 19h7z" fill="#7a5320" />
                    </svg>
                </div>
            ))}
            <Particles items={motes} className="bd-mote" />

            {/* hand-drawn map life: doodles, a sea serpent, gulls and bobbing waves */}
            <svg className="bd-doodle" viewBox="0 0 60 36" aria-hidden="true">
                <g fill="none" stroke="#5a3a12" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 30 L12 12 L18 22 L26 8 L38 30" />
                    <path d="M10 18 L13 22 M25 14 L28 20" />
                    <circle cx="46" cy="22" r="5" /><path d="M46 27 V33" />
                    <circle cx="55" cy="26" r="4" /><path d="M55 30 V34" />
                </g>
            </svg>
            <svg className="bd-serpent" viewBox="0 0 64 32" aria-hidden="true">
                <g fill="#4a2f0f" opacity="0.8">
                    <path className="bd-hump h1" d="M4 30 Q12 6 20 30Z" />
                    <path className="bd-hump h2" d="M22 30 Q30 4 38 30Z" />
                    <path className="bd-hump h3" d="M40 30 Q46 12 52 22 Q56 12 62 10 Q58 22 56 30Z" />
                    <circle className="bd-hump h3" cx="60" cy="10" r="1.2" fill="#f3e3b3" />
                </g>
            </svg>
            {[["14%", 62, -10], ["22%", 84, -46], ["9%", 104, -70]].map(([top, dur, delay]) => (
                <div key={top} className="bd-p bd-bird" style={{ "--top": top, "--dur": `${dur}s`, "--delay": `${delay}s` }}>
                    <svg viewBox="0 0 24 10" aria-hidden="true"><path d="M1 6 Q6 0 12 6 Q18 0 23 6" fill="none" stroke="#3a2409" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </div>
            ))}
            {squiggles.map((style, i) => (
                <svg key={i} className="bd-p bd-squiggle" style={style} viewBox="0 0 24 8" aria-hidden="true">
                    <path d="M1 5 Q4 1 7 5 T13 5 T19 5 T23 5" fill="none" stroke="#5a3a12" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
            ))}
        </>
    );
}

/* ------------------------------ Midnight Isles ----------------------------- */
function Midnight({ density }) {
    const stars = useParticles("mid-stars", 60, density, (r) => {
        const s = range(r, 1, 3);
        return { left: `${range(r, 0, 100)}%`, top: `${range(r, 0, 72)}%`, width: `${s}px`, height: `${s}px`, ...timing(r, range(r, 2.2, 6)) };
    });
    const flies = useParticles("mid-flies", 12, density, (r) => ({
        left: `${range(r, 4, 96)}%`, top: `${range(r, 55, 92)}%`, ...timing(r, range(r, 12, 24)), "--blink": `${range(r, 2, 4.5).toFixed(1)}s`,
    }));
    const mist = useParticles("mid-mist", 3, 1, (r, i) => ({
        top: `${58 + i * 12}%`, ...timing(r, 70 + i * 25), "--w": `${range(r, 45, 70)}cqw`,
    }));
    return (
        <>
            <Particles items={stars} className="bd-star" />
            <div className="bd-moon" />
            <div className="bd-p bd-shoot" style={{ top: "8%", left: "8%", "--dur": "13s", "--delay": "-4s" }} />
            <div className="bd-p bd-shoot" style={{ top: "22%", left: "30%", "--dur": "19s", "--delay": "-11s" }} />
            <Particles items={mist} className="bd-mist" />
            <Particles items={flies} className="bd-firefly" />
        </>
    );
}

/* -------------------------------- Candy Coast ------------------------------ */
const CANDY = ["#ff7eb6", "#7ee8c1", "#ffe36e", "#b8a1ff", "#7ec8ff", "#ffb27e"];
function Candy({ density }) {
    const sprinkles = useParticles("candy-sprinkles", 34, density, (r) => ({
        left: `${range(r, 0, 100)}%`, background: pick(r, CANDY), ...timing(r, range(r, 14, 26)),
        "--dx": `${range(r, -8, 8)}cqw`, "--rot": `${range(r, 200, 720).toFixed(0)}deg`, "--o": 0.9,
    }));
    const bubbles = useParticles("candy-bubbles", 12, density, (r) => {
        const s = range(r, 10, 34);
        return { left: `${range(r, 2, 96)}%`, width: `${s}px`, height: `${s}px`, ...timing(r, range(r, 14, 30)), "--dx": `${range(r, -7, 7)}cqw`, "--o": 0.9 };
    });
    const clouds = useParticles("candy-clouds", 3, 1, (r, i) => ({
        top: `${8 + i * 17}%`, ...timing(r, 80 + i * 30), width: `${range(r, 16, 26)}cqw`,
    }));
    const wave = (cls, fill) => (
        <svg className={`bd-wave ${cls}`} viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
            <path fill={fill} d="M0 10 Q12.5 0 25 10 T50 10 T75 10 T100 10 T125 10 T150 10 T175 10 T200 10 V20 H0Z" />
        </svg>
    );
    return (
        <>
            <div className="bd-fill bd-candy-grad" />
            <div className="bd-swirl" />
            <Particles items={clouds} className="bd-cloud" />
            <Particles items={bubbles} className="bd-bubble" />
            <Particles items={sprinkles} className="bd-sprinkle" />
            {wave("a", "rgba(255,255,255,0.38)")}
            {wave("b", "rgba(255,160,205,0.42)")}
        </>
    );
}

/* --------------------------------- Volcanic -------------------------------- */
function Volcanic({ density }) {
    const embers = useParticles("volc-embers", 42, density, (r) => ({
        left: `${range(r, 0, 100)}%`, "--sz": `${range(r, 2, 5.5).toFixed(1)}px`, ...timing(r, range(r, 7, 15)),
        "--dx": `${range(r, -9, 9)}cqw`, "--o": range(r, 0.6, 1).toFixed(2),
    }));
    const smoke = useParticles("volc-smoke", 4, density, (r) => ({
        left: `${range(r, 5, 85)}%`, ...timing(r, range(r, 22, 34)), "--dx": `${range(r, -8, 12)}cqw`,
    }));
    const ash = useParticles("volc-ash", 16, density, (r) => ({
        left: `${range(r, 0, 100)}%`, ...timing(r, range(r, 16, 30)), "--dx": `${range(r, -6, 10)}cqw`, "--rot": `${range(r, 90, 360).toFixed(0)}deg`, "--o": 0.55,
    }));
    return (
        <>
            <div className="bd-fill bd-lava" />
            <div className="bd-fill bd-erupt" />
            <svg className="bd-cracks" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 26 L12 22 L18 25 L31 19 L39 23 L52 17" />
                <path d="M48 30 L58 24 L66 27 L79 20 L88 24 L100 18" />
                <path d="M20 30 L27 27 L33 29 M72 30 L78 26 L86 29" />
            </svg>
            <Particles items={smoke} className="bd-smoke" />
            <Particles items={ash} className="bd-ash" />
            <Particles items={embers} className="bd-ember" />
        </>
    );
}

/* -------------------------------- Frozen Seas ------------------------------ */
function Snow({ count, density, name }) {
    const flakes = useParticles(name, count, density, (r) => {
        const s = range(r, 2, 6.5);
        return {
            left: `${range(r, 0, 100)}%`, width: `${s}px`, height: `${s}px`,
            ...timing(r, range(r, 22, 9) * (6.5 / (s + 2.5)) + 6),
            "--dx": `${range(r, -6, 6)}cqw`, "--o": (0.45 + s / 12).toFixed(2), "--sway": `${range(r, 3, 6).toFixed(1)}s`,
        };
    });
    return <Particles items={flakes} className="bd-snow" />;
}
function Frozen({ density }) {
    const floes = useParticles("frozen-floes", 5, 1, (r, i) => ({
        "--top": `${60 + i * 7 + range(r, 0, 3)}%`, "--w": `${range(r, 12, 24)}cqw`, "--h": `${range(r, 5, 11)}cqh`, ...timing(r, 70 + i * 18),
    }));
    const sparkles = useParticles("frozen-sparkles", 16, density, (r) => ({
        left: `${range(r, 3, 97)}%`, top: `${range(r, 50, 95)}%`, ...timing(r, range(r, 2.5, 5)),
    }));
    return (
        <>
            <div className="bd-p bd-aurora" />
            <div className="bd-p bd-aurora b" />
            <div className="bd-p bd-sweep" />
            <Particles items={floes} className="bd-floe" />
            <Particles items={sparkles} className="bd-sparkle" />
            <Snow name="frozen-snow" count={46} density={density} />
        </>
    );
}

/* ---------------------------- Seasonal (default) --------------------------- */
const PETALS = ["#ffc2d9", "#ffd9e8", "#fff0f5", "#ffb0cc"];
const LEAVES = ["#d2691e", "#b22222", "#e8a317", "#8b4513", "#c8501a"];
function Seasonal({ season, density }) {
    const petals = useParticles("sea-petals", 20, season === "Spring" ? density : 0.001, (r) => ({
        left: `${range(r, 0, 100)}%`, "--c": pick(r, PETALS), ...timing(r, range(r, 12, 22)), "--dx": `${range(r, -8, 8)}cqw`, "--rot": `${range(r, 200, 600).toFixed(0)}deg`,
    }));
    const pollen = useParticles("sea-pollen", 20, season === "Summer" ? density : 0.001, (r) => ({
        left: `${range(r, 0, 100)}%`, ...timing(r, range(r, 12, 24)), "--dx": `${range(r, -6, 6)}cqw`, "--o": 0.85,
    }));
    const leaves = useParticles("sea-leaves", 16, season === "Autumn" ? density : 0.001, (r) => ({
        left: `${range(r, 0, 100)}%`, "--c": pick(r, LEAVES), ...timing(r, range(r, 11, 20)), "--dx": `${range(r, -10, 10)}cqw`, "--rot": `${range(r, 240, 720).toFixed(0)}deg`,
    }));
    if (season === "Winter") return <Snow name="sea-snow" count={34} density={density} />;
    if (season === "Summer") return (<><div className="bd-p bd-sweep warm" /><Particles items={pollen} className="bd-pollen" /></>);
    if (season === "Autumn") return <Particles items={leaves} className="bd-leaf" />;
    return <Particles items={petals} className="bd-petal" />;
}

const LAYERS = { parchment: Parchment, midnight: Midnight, candy: Candy, volcanic: Volcanic, frozen: Frozen };

function ThemeBackdrop({ themeId, season = "Spring", density = 1 }) {
    const Layer = themeId === "seasonal" ? null : LAYERS[themeId];
    if (themeId !== "seasonal" && !Layer) return null;
    return (
        <div className="bd" data-theme={themeId} aria-hidden="true">
            {themeId === "seasonal" ? <Seasonal season={season} density={density} /> : <Layer density={density} />}
        </div>
    );
}

export default memo(ThemeBackdrop);
