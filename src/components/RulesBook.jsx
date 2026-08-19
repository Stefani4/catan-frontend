import { useEffect, useState } from "react";

const RULES_PAGES = [
    {
        title: "Objective of the Game",
        icon: "🏆",
        blocks: [
            { type: "p", text: "Be the first player to reach 10 Victory Points to win." },
            { type: "list", items: [
                    "Settlement — +1",
                    "City — +2",
                    "Longest Road — +2",
                    "Largest Army — +2",
                    "Victory Point Card — +1",
                ]},
            { type: "p", text: "The game ends immediately the moment a player reaches 10 or more points on their turn." },
        ],
    },

    {
        title: "The Game Board",
        icon: "🗺️",
        blocks: [
            { type: "p", text: "The board is made of hexagonal terrain tiles, each producing a resource, plus number tokens that trigger production." },
            { type: "list", items: [
                    "Forest → Lumber", "Hills → Brick", "Fields → Grain",
                    "Pastures → Wool", "Mountains → Ore", "Desert → nothing",
                ]},
            { type: "p", text: "Roads and buildings are placed on the intersections and edges between tiles." },
        ],
    },

    {
        title: "Players & Starting Setup",
        icon: "👥",
        blocks: [
            { type: "p", text: "Each player picks a color and receives their roads, settlements, cities, and development cards." },
            { type: "p", text: "In turn order, players place two starting settlements and two connected roads; both settlements must follow the Distance Rule." },
            { type: "p", text: "After the second settlement, collect one resource card from every terrain tile touching it." },
        ],
    },

    {
        title: "The Distance Rule",
        icon: "📏",
        blocks: [
            { type: "p", text: "Settlements and cities can never sit directly next to each other — at least one empty intersection must separate them." },
            { type: "p", text: "This applies both during setup and to all later building." },
        ],
    },

    {
        title: "Turn Structure",
        icon: "🔄",
        blocks: [
            { type: "list", items: [
                    "1. Determine the production number",
                    "2. Apply the current Season",
                    "3. Produce resources",
                    "4. Resolve the robber",
                    "5. Trade",
                    "6. Build",
                    "7. Play cards",
                    "8. End turn",
                ]},
            { type: "p", text: "You may trade and build as many times as you can afford during your turn." },
        ],
    },

    {
        title: "Resource Production",
        icon: "🌾",
        blocks: [
            { type: "p", text: "When a tile's number is rolled, every settlement touching it produces 1 of its resource, and every city produces 2. The desert never produces." },
            { type: "p", text: "Example: a Settlement next to a Forest numbered 6 produces 1 Lumber when a 6 is rolled — a City there produces 2." },
        ],
    },

    {
        title: "The Seasons Mechanic",
        icon: "🍂",
        blocks: [
            { type: "p", text: "A Season Track cycles through Spring → Summer → Autumn → Winter → Spring, each changing how resources are produced." },
            { type: "p", text: "The season advances every 5 completed turns, or whenever a player claims Largest Army." },
        ],
    },

    {
        title: "Spring — Fertility",
        icon: "🌸",
        blocks: [
            { type: "p", text: "When a 6 or 8 is rolled during Spring, Fields and Pastures produce one extra resource on top of their normal output." },
            { type: "p", text: "Example: a Settlement on a 6 Field normally makes 1 Grain — 2 Grain in Spring, or 3 Grain for a City." },
        ],
    },

    {
        title: "Summer — Harvest",
        icon: "☀️",
        blocks: [
            { type: "p", text: "During Summer, any tile numbered 5 or 9 produces double its normal output, for every resource type." },
            { type: "p", text: "Example: a Settlement on a 5 Forest normally makes 1 Lumber — 2 in Summer; a City there would make 4." },
        ],
    },

    {
        title: "Autumn — Abundance",
        icon: "🍁",
        blocks: [
            { type: "p", text: "During Autumn, Forests and Hills also produce on rolls of 3 and 11, in addition to their normal number." },
            { type: "p", text: "Example: a Forest numbered 8 produces Lumber on 8, 3, and 11 — making weaker numbers valuable again." },
        ],
    },

    {
        title: "Winter — Hardship",
        icon: "❄️",
        blocks: [
            { type: "p", text: "When a 2 or 12 is rolled during Winter, normal production is skipped — instead, the robber moves to that tile." },
            { type: "p", text: "Every player with a Settlement or City on that hex loses 1 random resource card. The robber does not steal in this case." },
        ],
    },

    {
        title: "Changing Seasons",
        icon: "📅",
        blocks: [
            { type: "p", text: "The current season is visible to everyone and stays active until the next trigger occurs." },
            { type: "p", text: "If a season change and a Largest Army claim happen at the same time, the season only advances once." },
        ],
    },

    {
        title: "Roads",
        icon: "🛤️",
        blocks: [
            { type: "p", text: "Cost: 1 Lumber + 1 Brick." },
            { type: "p", text: "A new road must connect to one of your existing roads, settlements, or cities, and can never cross through an opponent's settlement or city." },
        ],
    },

    {
        title: "Settlements",
        icon: "🏠",
        blocks: [
            { type: "p", text: "Cost: 1 Lumber + 1 Brick + 1 Grain + 1 Wool." },
            { type: "p", text: "Must be placed on an empty intersection connected to one of your roads, and must follow the Distance Rule. Produces 1 resource from each adjacent tile." },
        ],
    },

    {
        title: "Cities",
        icon: "🏛️",
        blocks: [
            { type: "p", text: "Cost: 2 Grain + 3 Ore." },
            { type: "p", text: "Built by upgrading one of your existing settlements — the settlement is replaced. A city produces 2 resources instead of 1 from each adjacent tile." },
        ],
    },

    {
        title: "Resort — Special Building",
        icon: "🏨",
        blocks: [
            { type: "p", text: "A unique building that lets you seize a location occupied by an opponent's city, by paying 3 Ore + 4 Lumber + 2 Wool + 1 Brick." },
            { type: "p", text: "The opponent's city is removed and replaced by your Resort, and any Victory Points it held are lost." },
            { type: "p", text: "A Resort can never be built on a Settlement, and once placed it cannot be overwritten or replaced." },
        ],
    },

    {
        title: "Trading",
        icon: "🤝",
        blocks: [
            { type: "p", text: "On your turn, you may negotiate any trade with another player, as long as both sides agree and it follows the resource rules." },
            { type: "p", text: "For example: \"1 Ore for 2 Grain.\"" },
        ],
    },

    {
        title: "Trading With the Bank",
        icon: "🏦",
        blocks: [
            { type: "p", text: "Trade 4 of one identical resource for 1 resource of your choice, at any time on your turn." },
            { type: "p", text: "Ports can offer better rates than the standard bank trade." },
        ],
    },

    {
        title: "Ports / Docks",
        icon: "⚓",
        blocks: [
            { type: "list", items: [
                    "General Port — 3 of one resource → 1 of your choice",
                    "Specialized Port — 2 of the matching resource → 1 of your choice",
                ]},
            { type: "p", text: "Available ports depend on the map in play." },
        ],
    },

    {
        title: "Development / Progress Cards",
        icon: "🃏",
        blocks: [
            { type: "p", text: "Cost: 1 Grain + 1 Wool + 1 Ore." },
            { type: "list", items: [
                    "Knight — move the robber and steal",
                    "Road Building — build 2 free roads",
                    "Year of Plenty — take any 2 resources",
                    "Monopoly — claim all of one resource from every player",
                    "Victory Point — worth 1 point",
                ]},
            { type: "p", text: "Unless a card says otherwise, it can't be played the same turn it was bought." },
        ],
    },

    {
        title: "The Robber",
        icon: "🥷",
        blocks: [
            { type: "p", text: "Rolling a 7 stops all production. Anyone holding more than 7 cards discards half, rounded down." },
            { type: "p", text: "The active player moves the robber to any hex, blocking it, and may steal one random resource from an opponent touching that hex." },
        ],
    },

    {
        title: "Robber Peace",
        icon: "🕊️",
        blocks: [
            { type: "p", text: "If the robber lands on your own settlement or city, you may pay 1 Lumber + 1 Brick + 1 Grain + 1 Wool + 1 Ore, once per turn, to send it straight to the Neutral Zone instead." },
            { type: "p", text: "The Neutral Zone never produces resources and isn't considered anyone's territory." },
        ],
    },

    {
        title: "Largest Army",
        icon: "⚔️",
        blocks: [
            { type: "p", text: "Claim this once you've played at least 3 Knights and have more than any other player — worth 2 Victory Points." },
            { type: "p", text: "Claiming it also advances the Season Track. Another player can take it over by playing more Knights than you." },
        ],
    },

    {
        title: "Longest Road",
        icon: "🛣️",
        blocks: [
            { type: "p", text: "Awarded to the player with the longest unbroken chain of 5 or more connected roads — worth 2 Victory Points." },
            { type: "p", text: "An opponent's settlement or city breaks your chain, and another player can take the title with a longer network." },
        ],
    },

    {
        title: "Victory Points",
        icon: "⭐",
        blocks: [
            { type: "list", items: [
                    "Settlement — +1",
                    "City — +2",
                    "Victory Point Card — +1",
                    "Longest Road — +2",
                    "Largest Army — +2",
                ]},
            { type: "p", text: "A Resort's exact point value depends on your game's implementation." },
        ],
    },

    {
        title: "Alternative Number Generation",
        icon: "🎲",
        blocks: [
            { type: "p", text: "Optional: instead of dice, you may use a number die or number wheel to determine the production number." },
            { type: "p", text: "Either method still interacts with the Season system exactly as normal." },
        ],
    },

    {
        title: "Custom Maps",
        icon: "🧭",
        blocks: [
            { type: "p", text: "Optional: players can choose from different maps, each with its own terrain layout, number tokens, ports, and desert placement." },
            { type: "p", text: "Whichever map is chosen stays active for the whole game." },
        ],
    },

    {
        title: "Player Count — Map Scaling",
        icon: "📐",
        blocks: [
            { type: "list", items: [
                    "2 Players → Smaller map",
                    "3–4 Players → Standard map",
                    "5+ Players → Larger map",
                ]},
            { type: "p", text: "Scaling the map keeps enough room to expand while still competing for good locations." },
        ],
    },

    {
        title: "End of the Game",
        icon: "🏁",
        blocks: [
            { type: "p", text: "The game ends the instant a player reaches 10 or more Victory Points — that player wins immediately." },
        ],
    },

    {
        title: "Happy Settling",
        icon: "🎉",
        blocks: [
            { type: "p", text: "That's everything you need to know. Now go build, trade, scheme, and conquer." },
            { type: "p", text: "Good luck and happy settling!" },
        ],
    },
];

function PageOrnaments() {
    return (
        <>
            <span style={{ position: "absolute", top: "8px", left: "10px", color: "#c9922f", fontSize: "0.8rem" }}>✦</span>
            <span style={{ position: "absolute", top: "8px", right: "10px", color: "#c9922f", fontSize: "0.8rem" }}>✦</span>
            <span style={{ position: "absolute", bottom: "8px", left: "10px", color: "#c9922f", fontSize: "0.8rem" }}>✦</span>
            <span style={{ position: "absolute", bottom: "8px", right: "10px", color: "#c9922f", fontSize: "0.8rem" }}>✦</span>
        </>
    );
}

function PageContent({ page, showFold }) {
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                background: "radial-gradient(circle at 50% 0%, #fbf1d4, #f0e0ac 85%)",
                fontFamily: "Georgia, serif",
                color: "#4a2f0f",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: "10px",
                    border: "1px solid #c9922f88",
                }}
            />
            {page && !page.blank && <PageOrnaments />}

            {page && !page.blank && (
                <div
                    style={{
                        position: "relative",
                        height: "100%",
                        padding: "26px 24px 18px",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        overflowY: "auto",
                    }}
                >
                    <div style={{ textAlign: "center", marginBottom: "10px" }}>
                        <div style={{ fontSize: "1.3rem" }}>{page.icon}</div>
                        <h3
                            style={{
                                margin: "4px 0 6px",
                                fontSize: "1rem",
                                letterSpacing: "0.5px",
                                color: "#5a3814",
                            }}
                        >
                            {page.title}
                        </h3>
                        <div style={{ width: "50px", height: "2px", background: "#c9922f", margin: "0 auto" }} />
                    </div>
                    <div style={{ fontSize: "0.78rem", lineHeight: 1.55, flex: 1 }}>
                        {page.blocks?.map((block, i) =>
                            block.type === "list" ? (
                                <ul key={i} style={{ margin: "0 0 10px 0", paddingLeft: "16px" }}>
                                    {block.items.map((item, j) => (
                                        <li key={j} style={{ marginBottom: "3px" }}>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p key={i} style={{ margin: "0 0 10px 0" }}>
                                    {block.text}
                                </p>
                            )
                        )}
                    </div>
                </div>
            )}

            {showFold && (
                <div
                    title="Turn the page"
                    style={{
                        position: "absolute",
                        right: 0,
                        bottom: 0,
                        width: "34px",
                        height: "34px",
                        background: "linear-gradient(135deg, transparent 50%, #dcc385 50%, #c9a96e 100%)",
                        boxShadow: "-2px -2px 6px rgba(0,0,0,0.15)",
                        clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
                    }}
                />
            )}
        </div>
    );
}

function ClosedCover({ onOpen }) {
    return (
        <div
            onClick={onOpen}
            title="Click to open"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: "8px",
                cursor: "pointer",
                background: "linear-gradient(160deg, #8a2323, #5a1414 55%, #4a0f0f)",
                border: "6px solid #6b1a1a",
                boxShadow: "0 18px 34px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(212,175,55,0.35)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
            }}
        >
            <span style={{ position: "absolute", top: "12px", left: "12px", color: "#d4af37", fontSize: "1rem" }}>✦</span>
            <span style={{ position: "absolute", top: "12px", right: "12px", color: "#d4af37", fontSize: "1rem" }}>✦</span>
            <span style={{ position: "absolute", bottom: "12px", left: "12px", color: "#d4af37", fontSize: "1rem" }}>✦</span>
            <span style={{ position: "absolute", bottom: "12px", right: "12px", color: "#d4af37", fontSize: "1rem" }}>✦</span>

            <div
                style={{
                    border: "2px solid #d4af37",
                    borderRadius: "6px",
                    padding: "22px 18px",
                    textAlign: "center",
                    boxShadow: "inset 0 0 14px rgba(0,0,0,0.35)",
                }}
            >
                <div style={{ fontSize: "2.2rem", marginBottom: "10px" }}>⚓</div>
                <div
                    style={{
                        fontFamily: "Georgia, serif",
                        fontWeight: "bold",
                        fontSize: "1.7rem",
                        letterSpacing: "3px",
                        color: "#f1d38a",
                        textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                    }}
                >
                    CATAN
                </div>
                <div
                    style={{
                        fontFamily: "Georgia, serif",
                        fontSize: "0.85rem",
                        marginTop: "6px",
                        color: "#e0c48a",
                        fontStyle: "italic",
                        letterSpacing: "1px",
                    }}
                >
                    Rulebook
                </div>
            </div>

            <div
                style={{
                    position: "absolute",
                    bottom: "-4px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "22px",
                    height: "34px",
                    background: "#c0392b",
                    clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    bottom: "16px",
                    fontFamily: "Georgia, serif",
                    fontSize: "0.7rem",
                    color: "#e0c48a99",
                    letterSpacing: "0.5px",
                }}
            >
                Tap to open
            </div>
        </div>
    );
}

export default function RulesBook({ onClose }) {
    const [isOpen, setIsOpen] = useState(false);
    const totalSheets = Math.ceil(RULES_PAGES.length / 2);
    const [currentSheet, setCurrentSheet] = useState(0);
    const [flippingIndex, setFlippingIndex] = useState(null);

    const goNext = () => {
        if (currentSheet < totalSheets) {
            setFlippingIndex(currentSheet);
            setCurrentSheet((s) => s + 1);
        }
    };
    const goPrev = () => {
        if (currentSheet > 0) {
            setFlippingIndex(currentSheet - 1);
            setCurrentSheet((s) => s - 1);
        } else setIsOpen(false);
    };

    useEffect(() => {
        const handleKey = (e) => {
            if (!isOpen) {
                if (e.key === "Enter" || e.key === "ArrowRight") setIsOpen(true);
            } else {
                if (e.key === "ArrowRight") goNext();
                if (e.key === "ArrowLeft") goPrev();
            }
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentSheet, totalSheets]);

    const bookWidth = "min(760px, 92vw)";
    const bookHeight = "min(460px, 72vh)";
    const closedWidth = "min(300px, 62vw)";

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(20,14,6,0.35)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: bookWidth,
                    height: bookHeight,
                }}
            >

                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        width: closedWidth,
                        height: "100%",
                        transform: isOpen ? "translateX(-50%) scale(0.82)" : "translateX(-50%) scale(1)",
                        opacity: isOpen ? 0 : 1,
                        transition: "opacity 0.45s ease, transform 0.45s ease",
                        pointerEvents: isOpen ? "none" : "auto",
                        zIndex: isOpen ? 1 : 10,
                    }}
                >
                    <ClosedCover onOpen={() => setIsOpen(true)} />
                </div>

                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? "scale(1)" : "scale(0.9)",
                        transition: "opacity 0.45s ease 0.05s, transform 0.45s ease 0.05s",
                        pointerEvents: isOpen ? "auto" : "none",
                        zIndex: isOpen ? 10 : 1,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "10px",
                            background: "linear-gradient(90deg, #6b1a1a, #8a2323 8%, #8a2323 92%, #6b1a1a)",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(212,175,55,0.35)",
                        }}
                    />
                    <span style={{ position: "absolute", top: "10px", left: "12px", color: "#d4af37", fontSize: "0.95rem", zIndex: 250 }}>✦</span>
                    <span style={{ position: "absolute", top: "10px", right: "12px", color: "#d4af37", fontSize: "0.95rem", zIndex: 250 }}>✦</span>
                    <span style={{ position: "absolute", bottom: "10px", left: "12px", color: "#d4af37", fontSize: "0.95rem", zIndex: 250 }}>✦</span>
                    <span style={{ position: "absolute", bottom: "10px", right: "12px", color: "#d4af37", fontSize: "0.95rem", zIndex: 250 }}>✦</span>

                    <div
                        style={{
                            position: "absolute",
                            top: "14px",
                            bottom: "14px",
                            left: "50%",
                            width: "16px",
                            marginLeft: "-8px",
                            background: "linear-gradient(90deg, rgba(0,0,0,0.4), rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.4))",
                            zIndex: 150,
                            pointerEvents: "none",
                        }}
                    />

                    <div
                        style={{
                            position: "absolute",
                            top: "14px",
                            bottom: "14px",
                            left: "14px",
                            width: "calc(50% - 14px)",
                            borderRadius: "4px 0 0 4px",
                            overflow: "hidden",
                            boxShadow: "inset -8px 0 12px -8px rgba(0,0,0,0.35)",
                            zIndex: 1,
                            background: "radial-gradient(circle at 50% 0%, #fbf1d4, #f0e0ac 85%)",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            top: "14px",
                            bottom: "14px",
                            right: "14px",
                            width: "calc(50% - 14px)",
                            borderRadius: "0 4px 4px 0",
                            overflow: "hidden",
                            boxShadow: "inset 8px 0 12px -8px rgba(0,0,0,0.35)",
                            zIndex: 1,
                            background: "radial-gradient(circle at 50% 0%, #fbf1d4, #f0e0ac 85%)",
                        }}
                    />

                    {/* Flipping sheets */}
                    {Array.from({ length: totalSheets }).map((_, i) => {
                        const isFlipped = i < currentSheet;
                        const front = RULES_PAGES[i * 2];
                        const back = RULES_PAGES[i * 2 + 1];
                        const isAnimating = i === flippingIndex;
                        const zIndex = isAnimating ? 500 : isFlipped ? i + 2 : totalSheets - i + 2;

                        return (
                            <div
                                key={i}
                                onClick={() => (isFlipped ? goPrev() : goNext())}
                                onTransitionEnd={() => {
                                    if (isAnimating) setFlippingIndex(null);
                                }}
                                style={{
                                    position: "absolute",
                                    top: "14px",
                                    bottom: "14px",
                                    left: "50%",
                                    width: "calc(50% - 14px)",
                                    transformOrigin: "left center",
                                    transformStyle: "preserve-3d",
                                    transition: "transform 0.7s cubic-bezier(0.4, 0.1, 0.2, 1)",
                                    transform: isFlipped ? "rotateY(-180deg)" : "rotateY(0deg)",
                                    zIndex,
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        backfaceVisibility: "hidden",
                                        borderRadius: "0 4px 4px 0",
                                        overflow: "hidden",
                                        boxShadow: "2px 0 8px rgba(0,0,0,0.25)",
                                    }}
                                >
                                    <PageContent page={front} showFold={i === currentSheet} />
                                </div>
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        backfaceVisibility: "hidden",
                                        transform: "rotateY(180deg)",
                                        borderRadius: "4px 0 0 4px",
                                        overflow: "hidden",
                                        boxShadow: "-2px 0 8px rgba(0,0,0,0.25)",
                                    }}
                                >
                                    <PageContent page={back} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isOpen && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "18px",
                        marginTop: "18px",
                    }}
                >
                    <button
                        onClick={goPrev}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "2px solid #c9a96e",
                            background: "rgba(20,14,6,0.85)",
                            color: "#f2e6c9",
                            fontFamily: "Georgia, serif",
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                    >
                        ◀ {currentSheet === 0 ? "Close" : "Prev"}
                    </button>
                    <span
                        style={{
                            color: "#f2e6c9",
                            fontFamily: "Georgia, serif",
                            fontSize: "0.85rem",
                            minWidth: "90px",
                            textAlign: "center",
                        }}
                    >
                        Page {Math.min(currentSheet + 1, totalSheets)} / {totalSheets}
                    </span>
                    <button
                        onClick={goNext}
                        disabled={currentSheet === totalSheets}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "2px solid #c9a96e",
                            background: currentSheet === totalSheets ? "rgba(20,14,6,0.4)" : "rgba(20,14,6,0.85)",
                            color: "#f2e6c9",
                            fontFamily: "Georgia, serif",
                            fontWeight: "bold",
                            cursor: currentSheet === totalSheets ? "not-allowed" : "pointer",
                            opacity: currentSheet === totalSheets ? 0.5 : 1,
                        }}
                    >
                        Next ▶
                    </button>
                </div>
            )}
        </div>
    );
}