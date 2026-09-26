import { useEffect, useState } from "react";
import { useTranslation } from "../i18n.js";

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
    const { t } = useTranslation();
    const RULES_PAGES = t("rulesPages", { returnObjects: true });
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