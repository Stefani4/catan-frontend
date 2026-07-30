import { useEffect, useState } from "react";
import { decodePlayerIdentity } from "../profileStore.js";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

export function usePlayerIdentities(matchID, pollMs = 4000) {
    const [identities, setIdentities] = useState({});

    useEffect(() => {
        if (!matchID) return undefined;
        let cancelled = false;

        const fetchIdentities = () => {
            fetch(`${SERVER}/games/catan/${matchID}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (cancelled || !data?.players) return;
                    const next = {};
                    data.players.forEach((p) => {
                        if (p.name) next[String(p.id)] = decodePlayerIdentity(p.name, p.id);
                    });
                    setIdentities(next);
                })
                .catch(() => {});
        };

        fetchIdentities();
        const interval = setInterval(fetchIdentities, pollMs);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [matchID, pollMs]);

    return identities;
}
