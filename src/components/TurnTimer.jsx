import { useEffect, useState, useRef } from "react";
import { loadSettings } from "../settingsStore.js";

const ROLL_SECONDS = 5;
const DEFAULT_ACTION_SECONDS = 60;

export default function TurnTimer({ G, moves }) {
    const isRollPhase = !G.diceRolled;
    const actionSeconds = useRef(
        Math.max(5, Number(loadSettings().turnTimer) || DEFAULT_ACTION_SECONDS),
    ).current;
    const limit = isRollPhase ? ROLL_SECONDS : actionSeconds;

    const [timeLeft, setTimeLeft] = useState(limit);

    const movesRef = useRef(moves);
    const isRollRef = useRef(isRollPhase);
    useEffect(() => {
        movesRef.current = moves;
    }, [moves]);
    useEffect(() => {
        isRollRef.current = isRollPhase;
    }, [isRollPhase]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setTimeout(() => {
                        if (isRollRef.current) {
                            movesRef.current.rollDice?.();
                        } else {
                            movesRef.current.endTurn?.();
                        }
                    }, 0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const pct = (timeLeft / limit) * 100;
    const barColor = pct > 50 ? "#2ecc71" : pct > 25 ? "#f39c12" : "#e74c3c";
    const label = isRollPhase
        ? `🎲 Roll the dice! Auto-rolls in ${timeLeft}s`
        : `⏳ ${timeLeft}s left to act — turn ends automatically`;

    return (
        <div style={{ marginTop: "12px" }}>
            <div
                style={{
                    fontSize: "0.82rem",
                    color: "#ccc",
                    marginBottom: "5px",
                    textAlign: "center",
                    fontStyle: "italic",
                }}
            >
                {label}
            </div>
            <div
                style={{
                    width: "100%",
                    height: "8px",
                    borderRadius: "4px",
                    backgroundColor: "#333",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${pct}%`,
                        height: "100%",
                        backgroundColor: barColor,
                        borderRadius: "4px",
                        transition: "width 1s linear, background-color 0.5s",
                    }}
                />
            </div>
            <div
                style={{
                    textAlign: "right",
                    fontSize: "0.75rem",
                    color: barColor,
                    marginTop: "3px",
                    fontWeight: "bold",
                    transition: "color 0.5s",
                }}
            >
                {timeLeft}s
            </div>
        </div>
    );
}
