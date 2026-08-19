import { useEffect, useRef } from "react";
import { createBotClient } from "./botClient.js";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

export default function BotManager({ matchID, bots }) {
  const clientsRef = useRef([]);
  const key = JSON.stringify((bots || []).map((b) => [b.seat, b.credentials]));

  useEffect(() => {
    if (!matchID || !bots || bots.length === 0) return undefined;

    clientsRef.current = bots.map((bot) =>
      createBotClient({
        server: SERVER,
        matchID,
        playerID: bot.seat,
        credentials: bot.credentials,
      }),
    );

    return () => {
      clientsRef.current.forEach((c) => c.stop());
      clientsRef.current = [];
    };
  }, [matchID, key]);

  return null;
}
