import { useEffect, useRef } from "react";
import { playSfx } from "../audio/soundEngine.js";

function totalBuildings(players) {
    return Object.values(players || {}).reduce((sum, p) => {
        return (
            sum +
            (p.settlements?.length || 0) +
            (p.cities?.length || 0) +
            (p.roads?.length || 0) +
            (p.resorts?.length || 0)
        );
    }, 0);
}

export function useGameSounds(G, ctx) {
    const prev = useRef(null);

    useEffect(() => {
        if (!G) return;

        const snapshot = {
            diceRolled: Boolean(G.diceRolled),
            buildings: totalBuildings(G.players),
            devCardCount: G.devCardDeck?.length ?? null,
            robberPosition: G.board?.robberPosition,
            lastTradeStatus: G.lastTradeStatus,
            reactionCount: G.reactions?.length ?? 0,
            gameover: Boolean(ctx?.gameover),
        };

        const p = prev.current;
        if (p) {
            if (!p.diceRolled && snapshot.diceRolled) playSfx("diceRoll");
            if (snapshot.buildings > p.buildings) playSfx("build");
            if (p.devCardCount !== null && snapshot.devCardCount !== null && snapshot.devCardCount < p.devCardCount) {
                playSfx("buyCard");
            }
            if (p.robberPosition && snapshot.robberPosition && p.robberPosition !== snapshot.robberPosition) {
                playSfx("robber");
            }
            if (p.lastTradeStatus !== "success" && snapshot.lastTradeStatus === "success") {
                playSfx("trade");
            }
            if (snapshot.reactionCount > p.reactionCount) playSfx("reaction");
            if (!p.gameover && snapshot.gameover) playSfx("victory");
        }

        prev.current = snapshot;
    }, [G, ctx]);
}