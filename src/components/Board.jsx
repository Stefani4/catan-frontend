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

export default function Board({ G, ctx, moves, events, playerID, matchID }) {
    const [notification, setNotification] = useState("");
    const [pendingCardAction, setPendingCardAction] = useState(null);
    const [sidePanelTab, setSidePanelTab] = useState("trades");

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
                setNotification("Trade Successful!");
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
    }, [G.lastTradeStatus, moves]);

    if (!G || !G.players || !G.players[ctx.currentPlayer]) {
        return <div>Loading player data...</div>;
    }

    const boardLayout = G.board?.layout || { width: 550, height: 513 };
    const BOARD_AREA_BUDGET = { width: 620, height: 560 };
    const boardScale = Math.min(
        1,
        BOARD_AREA_BUDGET.width / boardLayout.width,
        BOARD_AREA_BUDGET.height / boardLayout.height,
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
                                        ? "Pay 1 of each resource to send the Robber back to the desert"
                                        : "Needs 1 of every resource"
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
                                💰 Pay to Clear Robber
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
                <PlayerStats G={G} ctx={ctx} matchID={matchID} />
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
                                    ⏩ End Turn Now
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

            <VictoryModal
                G={G}
                ctx={ctx}
                playerID={playerID}
                matchID={matchID}
                onLeave={() => {
                    clearMatchSession();
                    window.location.href = window.location.pathname;
                }}
            />
        </div>
    );
}
