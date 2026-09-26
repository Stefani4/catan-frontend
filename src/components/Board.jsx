import GameHeader from "./GameHeader.jsx";
import PlayerStats from "./PlayerStats.jsx";
import SidePanel from "./SidePanel.jsx";
import GameBoard from "./GameBoard.jsx";
import TurnTimer from "./TurnTimer.jsx";
import DiceRoller from "./DiceRoller.jsx";
import ResourceHand from "./ResourceHand.jsx";
import BuildCostsPanel from "./BuildCostsPanel.jsx";
import VictoryModal from "./VictoryModal.jsx";
import { useState, useEffect } from "react";
import { clearMatchSession } from "../matchSession.js";
import { useGameSounds } from "../hooks/useGameSounds.js";
import { useViewportSize } from "../hooks/useViewportSize.js";
import { useTranslation } from "../i18n.js";
import springBg from "../../images/springB.png";
import summerBg from "../../images/summerB.png";
import autumnBg from "../../images/autumnB.png";
import winterBg from "../../images/winterB.png";

const seasonBackgrounds = {
    Spring: springBg,
    Summer: summerBg,
    Autumn: autumnBg,
    Winter: winterBg,
};

export default function Board({ G, ctx, moves, events, playerID, matchID, bots, onRematch }) {
    const { t } = useTranslation();
    const [notification, setNotification] = useState("");
    const [pendingCardAction, setPendingCardAction] = useState(null);
    const [sidePanelTab, setSidePanelTab] = useState("trades");
    const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
    const [mobilePanel, setMobilePanel] = useState(null); // null | "stats" | "trade"

    const handleExitGame = () => {
        clearMatchSession();
        window.location.href = window.location.pathname;
    };

    useGameSounds(G, ctx);
    const viewport = useViewportSize();

    const isMyTurn = playerID === undefined || ctx.currentPlayer === playerID;

    useEffect(() => {
        const handler = (e) => {
            const tag = e.target?.tagName;
            const isTyping = tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable;
            if (isTyping) return;

            if (e.code === "Space") {
                if (isMyTurn && !G.diceRolled && !G.isRobberPlacing) {
                    e.preventDefault();
                    moves.rollDice?.();
                }
            } else if (e.code === "Enter") {
                if (isMyTurn && G.diceRolled) {
                    e.preventDefault();
                    moves.endTurn?.();
                }
            } else if (e.key === "t" || e.key === "T") {
                setSidePanelTab("trades");
            } else if (e.key === "c" || e.key === "C") {
                setSidePanelTab("chat");
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [G.diceRolled, G.isRobberPlacing, isMyTurn, moves]);

    useEffect(() => {
        if (G.lastTradeStatus === "success") {
            const showTimer = setTimeout(() => {
                setNotification(t("tradeSuccessful"));
            }, 0);

            const hideTimer = setTimeout(() => {
                setNotification("");

                if (moves.clearTradeStatus) {
                    moves.clearTradeStatus();
                }
            }, 3000);

            return () => {
                clearTimeout(showTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [G.lastTradeStatus, moves, t]);

    if (!G || !G.players || !G.players[ctx.currentPlayer]) {
        return <div>{t("loadingPlayerData")}</div>;
    }

    const boardLayout = G.board?.layout || { width: 550, height: 513 };
    // On narrow/short screens (phones), shrink the fit budget to the real
    // viewport instead of always assuming a desktop-sized window — this is
    // what actually keeps the board from overflowing on mobile.
    const SIDE_PADDING = 24;
    const TOP_BOTTOM_PADDING = 140; // room for the header/HUD above and below
    const BOARD_AREA_BUDGET = {
        width: Math.min(620, viewport.width - SIDE_PADDING * 2),
        height: Math.min(560, viewport.height - TOP_BOTTOM_PADDING),
    };
    const boardScale = Math.min(
        1,
        BOARD_AREA_BUDGET.width / boardLayout.width,
        BOARD_AREA_BUDGET.height / boardLayout.height,
    );

    // Below this width the old landscape 3-column layout (side panels pinned
    // to the left/right edges, board scaled in the middle) doesn't fit —
    // that's what was clipping/hiding panels on phones. Switch to a single
    // stacked, vertical layout instead: header on top, board in the middle,
    // controls + a slide-up drawer for stats/trading at the bottom.
    const MOBILE_BREAKPOINT = 700;
    const isMobile = viewport.width < MOBILE_BREAKPOINT;
    const MOBILE_TOP_RESERVE = 170; // exit button clearance + header
    const MOBILE_BOTTOM_RESERVE = 190; // resource hand + controls + turn timer
    const mobileBoardScale = Math.max(
        0.35,
        Math.min(
            1,
            (viewport.width - 16) / boardLayout.width,
            (viewport.height - MOBILE_TOP_RESERVE - MOBILE_BOTTOM_RESERVE) / boardLayout.height,
        ),
    );

    return (
        <div
            style={{
                height: "100vh",
                width: "100vw",
                overflow: "hidden",
                backgroundImage: `url(${
                    G.settings?.seasonsEnabled !== false
                        ? seasonBackgrounds[G.season]
                        : seasonBackgrounds.Spring
                })`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#000",
                position: "fixed",
                top: 0,
                left: 0,
            }}
        >
            {notification && (
                <div
                    style={{
                        position: "fixed",
                        top: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "#27ae60",
                        color: "white",
                        padding: "12px 25px",
                        borderRadius: "8px",
                        zIndex: 9999,
                        fontWeight: "bold",
                        border: "2px solid white",
                    }}
                >
                    {notification}
                </div>
            )}

            <button
                onClick={() => setExitConfirmOpen(true)}
                title={t("exitGameTt")}
                style={{
                    position: "fixed",
                    top: "8px",
                    left: "8px",
                    zIndex: 300,
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    border: "1px solid rgba(201,169,110,0.6)",
                    background: "rgba(0,0,0,0.65)",
                    color: "#f1d38a",
                    fontSize: "1rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                🚪
            </button>

            {exitConfirmOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.72)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 400,
                    }}
                >
                    <div
                        style={{
                            background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                            border: "3px solid #7a5320",
                            borderRadius: "14px",
                            padding: "26px 32px",
                            textAlign: "center",
                            fontFamily: "Georgia, serif",
                            color: "#3a2409",
                            maxWidth: "340px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                        }}
                    >
                        <h3 style={{ margin: "0 0 8px 0" }}>{t("exitConfirmTitle")}</h3>
                        <p style={{ fontSize: "0.85rem", color: "#5a4326", margin: "0 0 18px 0" }}>
                            {t("exitConfirmBody")}
                        </p>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                            <button
                                onClick={handleExitGame}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: "2px solid #f1d38a",
                                    background: "linear-gradient(135deg, #8a2020, #c94848)",
                                    color: "white",
                                    fontWeight: "bold",
                                    fontFamily: "Georgia, serif",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                }}
                            >
                                {t("exitConfirmYes")}
                            </button>
                            <button
                                onClick={() => setExitConfirmOpen(false)}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: "2px solid #7a5320",
                                    background: "rgba(255,255,255,0.4)",
                                    color: "#3a2409",
                                    fontWeight: "bold",
                                    fontFamily: "Georgia, serif",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                }}
                            >
                                {t("exitConfirmCancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isMobile ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
                    <div style={{ flexShrink: 0, padding: "44px 10px 4px" }}>
                        <GameHeader G={G} ctx={ctx} moves={moves} playerID={playerID} matchID={matchID} />
                    </div>

                    <div
                        style={{
                            position: "relative",
                            flex: 1,
                            minHeight: 0,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                transform: `scale(${mobileBoardScale})`,
                                transformOrigin: "center center",
                            }}
                        >
                            <GameBoard
                                G={G}
                                ctx={ctx}
                                moves={moves}
                                playerID={playerID}
                                matchID={matchID}
                                pendingCardAction={pendingCardAction}
                                setPendingCardAction={setPendingCardAction}
                            />

                            {G.settings?.robberPayToClear !== false &&
                                (() => {
                                    const viewingId = String(
                                        playerID !== undefined ? playerID : ctx.currentPlayer,
                                    );
                                    const isMyTurn = String(ctx.currentPlayer) === viewingId;
                                    const robberHex = G.board.hexes.find(
                                        (h) => h.id === G.board.robberPosition,
                                    );
                                    const me = G.players[viewingId];
                                    const threatened =
                                        robberHex &&
                                        me &&
                                        [...me.settlements, ...me.cities, ...(me.resorts || [])].some(
                                            (b) => b.adjacentHexes?.includes(robberHex.id),
                                        );
                                    if (!isMyTurn || !threatened) return null;

                                    const costs = ["brick", "lumber", "grain", "wool", "ore"];
                                    const canAfford = costs.every((r) => (me.resources?.[r] ?? 0) >= 1);

                                    return (
                                        <button
                                            onClick={() => moves.payToMoveRobber()}
                                            disabled={!canAfford}
                                            title={
                                                canAfford
                                                    ? t("payToClearRobberHint")
                                                    : t("payToClearRobberNeedsHint")
                                            }
                                            style={{
                                                position: "absolute",
                                                bottom: "-16%",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                zIndex: 40,
                                                padding: "8px 14px",
                                                borderRadius: "10px",
                                                border: `2px solid ${canAfford ? "#f1d38a" : "#666"}`,
                                                background: canAfford
                                                    ? "linear-gradient(135deg, #8a5a20, #c9922f)"
                                                    : "#4a4a4a",
                                                color: "white",
                                                fontFamily: "Georgia, serif",
                                                fontWeight: "bold",
                                                fontSize: "0.75rem",
                                                cursor: canAfford ? "pointer" : "not-allowed",
                                                opacity: canAfford ? 1 : 0.7,
                                                boxShadow: "0 3px 8px rgba(0,0,0,0.4)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {t("payToClearRobber")}
                                        </button>
                                    );
                                })()}
                        </div>

                        <div
                            style={{
                                position: "absolute",
                                top: "2px",
                                right: "4px",
                                zIndex: 40,
                                transform: "scale(0.7)",
                                transformOrigin: "top right",
                            }}
                        >
                            <DiceRoller G={G} ctx={ctx} moves={moves} playerID={playerID} />
                        </div>
                    </div>

                    <div
                        style={{
                            flexShrink: 0,
                            zIndex: 20,
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            padding: "6px 8px calc(8px + env(safe-area-inset-bottom, 0px))",
                            background: "linear-gradient(0deg, rgba(0,0,0,0.62), rgba(0,0,0,0.05))",
                        }}
                    >
                        {ctx.phase !== "setup" && (
                            <div
                                style={{
                                    overflowX: "auto",
                                    WebkitOverflowScrolling: "touch",
                                    display: "flex",
                                    justifyContent: "flex-start",
                                }}
                            >
                                <div style={{ transform: "scale(0.8)", transformOrigin: "left center" }}>
                                    <ResourceHand
                                        G={G}
                                        ctx={ctx}
                                        moves={moves}
                                        playerID={playerID}
                                        pendingCardAction={pendingCardAction}
                                        setPendingCardAction={setPendingCardAction}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "6px", alignItems: "stretch" }}>
                            <button
                                onClick={() => setMobilePanel(mobilePanel === "stats" ? null : "stats")}
                                title={t("playersInMatch")}
                                style={{
                                    padding: "9px 14px",
                                    borderRadius: "8px",
                                    border: "2px solid #c9a96e",
                                    background:
                                        mobilePanel === "stats"
                                            ? "linear-gradient(135deg, #4a2000, #8a5a20)"
                                            : "rgba(0,0,0,0.45)",
                                    color: "#f1d38a",
                                    fontSize: "1rem",
                                    cursor: "pointer",
                                }}
                            >
                                📊
                            </button>
                            <button
                                onClick={() => setMobilePanel(mobilePanel === "trade" ? null : "trade")}
                                title={t("tabTrades")}
                                style={{
                                    position: "relative",
                                    padding: "9px 14px",
                                    borderRadius: "8px",
                                    border: "2px solid #c9a96e",
                                    background:
                                        mobilePanel === "trade"
                                            ? "linear-gradient(135deg, #4a2000, #8a5a20)"
                                            : "rgba(0,0,0,0.45)",
                                    color: "#f1d38a",
                                    fontSize: "1rem",
                                    cursor: "pointer",
                                }}
                            >
                                ⚓
                                {G.activeOffer && String(G.activeOffer.to) === String(playerID) && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: "3px",
                                            right: "5px",
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            background: "#ff4d4d",
                                            boxShadow: "0 0 4px rgba(255,0,0,0.8)",
                                        }}
                                    />
                                )}
                            </button>

                            {ctx.phase !== "setup" &&
                                G.diceRolled &&
                                (playerID === undefined || ctx.currentPlayer === playerID) && (
                                    <button
                                        onClick={() => moves.endTurn()}
                                        style={{
                                            flex: 1,
                                            padding: "9px",
                                            backgroundColor: "#e74c3c",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        {t("endTurnNow")}
                                    </button>
                                )}
                        </div>

                        {ctx.phase !== "setup" && (
                            <TurnTimer
                                key={`${ctx.currentPlayer}-${G.diceRolled}`}
                                G={G}
                                ctx={ctx}
                                moves={moves}
                            />
                        )}
                    </div>

                    {mobilePanel && (
                        <div
                            onClick={() => setMobilePanel(null)}
                            style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(0,0,0,0.55)",
                                zIndex: 250,
                            }}
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    maxHeight: "72vh",
                                    overflowY: "auto",
                                    background: "linear-gradient(160deg, #2c1e0e, #1c1208)",
                                    borderTop: "2px solid #c9a96e",
                                    borderRadius: "16px 16px 0 0",
                                    padding: "14px 14px calc(14px + env(safe-area-inset-bottom, 0px))",
                                    boxShadow: "0 -8px 30px rgba(0,0,0,0.6)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6px" }}>
                                    <button
                                        onClick={() => setMobilePanel(null)}
                                        style={{
                                            background: "rgba(255,255,255,0.1)",
                                            border: "1px solid #c9a96e",
                                            color: "#f1d38a",
                                            borderRadius: "50%",
                                            width: "28px",
                                            height: "28px",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>

                                {mobilePanel === "stats" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <PlayerStats G={G} ctx={ctx} matchID={matchID} moves={moves} playerID={playerID} />
                                        {ctx.phase !== "setup" && <BuildCostsPanel G={G} playerID={playerID} />}
                                    </div>
                                )}

                                {mobilePanel === "trade" && (
                                    <SidePanel
                                        G={G}
                                        ctx={ctx}
                                        moves={moves}
                                        playerID={playerID}
                                        matchID={matchID}
                                        tab={sidePanelTab}
                                        onTabChange={setSidePanelTab}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: `translate(-50%, -50%) scale(${boardScale})`,
                            transformOrigin: "center center",
                            zIndex: 10,
                        }}
                    >
                        <GameBoard
                            G={G}
                            ctx={ctx}
                            moves={moves}
                            playerID={playerID}
                            matchID={matchID}
                            pendingCardAction={pendingCardAction}
                            setPendingCardAction={setPendingCardAction}
                        />

                        <div
                            style={{
                                position: "absolute",
                                top: "-8%",
                                right: "-19%",
                                zIndex: 40,
                            }}
                        >
                            <DiceRoller G={G} ctx={ctx} moves={moves} playerID={playerID} />
                        </div>

                        {G.settings?.robberPayToClear !== false &&
                            (() => {
                                const viewingId = String(
                                    playerID !== undefined ? playerID : ctx.currentPlayer,
                                );
                                const isMyTurn = String(ctx.currentPlayer) === viewingId;
                                const robberHex = G.board.hexes.find(
                                    (h) => h.id === G.board.robberPosition,
                                );
                                const me = G.players[viewingId];
                                const threatened =
                                    robberHex &&
                                    me &&
                                    [...me.settlements, ...me.cities, ...(me.resorts || [])].some(
                                        (b) => b.adjacentHexes?.includes(robberHex.id),
                                    );
                                if (!isMyTurn || !threatened) return null;

                                const costs = ["brick", "lumber", "grain", "wool", "ore"];
                                const canAfford = costs.every((r) => (me.resources?.[r] ?? 0) >= 1);

                                return (
                                    <button
                                        onClick={() => moves.payToMoveRobber()}
                                        disabled={!canAfford}
                                        title={
                                            canAfford
                                                ? t("payToClearRobberHint")
                                                : t("payToClearRobberNeedsHint")
                                        }
                                        style={{
                                            position: "absolute",
                                            top: "38%",
                                            right: "-30%",
                                            zIndex: 40,
                                            padding: "8px 14px",
                                            borderRadius: "10px",
                                            border: `2px solid ${canAfford ? "#f1d38a" : "#666"}`,
                                            background: canAfford
                                                ? "linear-gradient(135deg, #8a5a20, #c9922f)"
                                                : "#4a4a4a",
                                            color: "white",
                                            fontFamily: "Georgia, serif",
                                            fontWeight: "bold",
                                            fontSize: "0.75rem",
                                            cursor: canAfford ? "pointer" : "not-allowed",
                                            opacity: canAfford ? 1 : 0.7,
                                            boxShadow: "0 3px 8px rgba(0,0,0,0.4)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {t("payToClearRobber")}
                                    </button>
                                );
                            })()}
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            top: "50px",
                            left: "20px",
                            zIndex: 20,
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                            maxHeight: "calc(100vh - 70px)",
                            overflowY: "auto",
                            paddingRight: "4px",
                        }}
                    >
                        <PlayerStats G={G} ctx={ctx} matchID={matchID} moves={moves} playerID={playerID} />
                        {ctx.phase !== "setup" && <BuildCostsPanel G={G} playerID={playerID} />}
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            top: "50px",
                            right: "20px",
                            zIndex: 20,
                            width: "280px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            maxHeight: "90vh",
                            alignItems: "stretch",
                        }}
                    >
                        <GameHeader G={G} ctx={ctx} moves={moves} playerID={playerID} matchID={matchID} />
                        <SidePanel
                            G={G}
                            ctx={ctx}
                            moves={moves}
                            playerID={playerID}
                            matchID={matchID}
                            tab={sidePanelTab}
                            onTabChange={setSidePanelTab}
                        />
                        {ctx.phase !== "setup" && (
                            <>
                                <TurnTimer
                                    key={`${ctx.currentPlayer}-${G.diceRolled}`}
                                    G={G}
                                    ctx={ctx}
                                    moves={moves}
                                />
                                {G.diceRolled &&
                                    (playerID === undefined || ctx.currentPlayer === playerID) && (
                                        <button
                                            onClick={() => moves.endTurn()}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                backgroundColor: "#e74c3c",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                fontWeight: "bold",
                                                cursor: "pointer",
                                                fontSize: "0.95rem",
                                            }}
                                        >
                                            {t("endTurnNow")}
                                        </button>
                                    )}
                            </>
                        )}
                    </div>

                    {ctx.phase !== "setup" && (
                        <div
                            style={{
                                position: "fixed",
                                bottom: "18px",
                                left: "20px",
                                right: "320px",
                                zIndex: 30,
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <ResourceHand
                                G={G}
                                ctx={ctx}
                                moves={moves}
                                playerID={playerID}
                                pendingCardAction={pendingCardAction}
                                setPendingCardAction={setPendingCardAction}
                            />
                        </div>
                    )}
                </>
            )}

            <VictoryModal
                G={G}
                ctx={ctx}
                playerID={playerID}
                matchID={matchID}
                bots={bots}
                onStartRematch={onRematch}
                onLeave={() => {
                    clearMatchSession();
                    window.location.href = window.location.pathname;
                }}
            />
        </div>
    );
}