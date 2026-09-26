import { useEffect, useRef, useState } from "react";

const BURST_LIFETIME_MS = 2200;

export function useReactionBursts(reactions) {
    const [bursts, setBursts] = useState({});
    const seenIds = useRef(new Set());
    const timers = useRef({});

    useEffect(() => {
        (reactions || []).forEach((r) => {
            if (seenIds.current.has(r.id)) return;
            seenIds.current.add(r.id);

            setBursts((prev) => ({ ...prev, [String(r.playerId)]: r }));

            clearTimeout(timers.current[r.playerId]);
            timers.current[r.playerId] = setTimeout(() => {
                setBursts((prev) => {
                    if (prev[String(r.playerId)]?.id !== r.id) return prev;
                    const next = { ...prev };
                    delete next[String(r.playerId)];
                    return next;
                });
            }, BURST_LIFETIME_MS);
        });
    }, [reactions]);

    useEffect(() => {
        const timersAtMount = timers.current;
        return () => {
            Object.values(timersAtMount).forEach(clearTimeout);
        };
    }, []);

    return bursts;
}