import { useEffect, useRef, useState } from "react";
import { claimMatchRewards } from "../economy/walletStore.js";

/**
 * Pays out a finished match to the local wallet (once) and returns the receipt.
 *
 * It deliberately waits until every seat's identity is known: whether the
 * opponents are bots changes the payout, and because claiming is idempotent a
 * payout computed from incomplete data could never be corrected afterwards.
 */
export function useMatchRewards({ G, ctx, playerID, matchID, identities }) {
    const [receipt, setReceipt] = useState(null);
    const claimedFor = useRef(null);

    const winner = ctx.gameover?.winner;
    const isOver = winner !== undefined && winner !== null;
    const me = playerID === undefined || playerID === null ? null : String(playerID);
    const seats = G?.players ? Object.keys(G.players) : [];
    const identitiesReady = seats.length > 0 && seats.every((pid) => identities && identities[pid]);

    useEffect(() => {
        if (!isOver || !me || !matchID || !identitiesReady) return;
        if (claimedFor.current === matchID) return;
        claimedFor.current = matchID;

        const humanOpponents = seats.filter((pid) => pid !== me && !identities[pid].isBot).length;
        const result = claimMatchRewards({
            matchID,
            mode: G.settings?.gameMode || "classic",
            won: String(winner) === me,
            humanOpponents,
            player: G.players[me],
            playerTrades: G.stats?.playerTrades?.[me] || 0,
        });
        setReceipt(result.receipt || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOver, me, matchID, identitiesReady]);

    return receipt;
}
