import { useEffect, useState, useMemo } from "react";
import { Client } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import Board from "./components/Board";
import { CatanGame } from "../game/CatanGame.js";

export default function MatchLoader() {
  const [matchData, setMatchData] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const currentPlayerID = params.get("player") || "0";
  const existingMatchID = params.get("matchID");

  const CatanClient = useMemo(() => {
    return Client({
      game: CatanGame,
      board: Board,
      multiplayer: SocketIO({ server: "http://localhost:8000" }),
      debug: true,
      loading: () => <div>Syncing with server...</div>,
    });
  }, []);

  useEffect(() => {
    async function initGame() {
      let matchID = existingMatchID;

      if (!matchID) {
        const createRes = await fetch(
          "http://localhost:8000/games/catan/create",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numPlayers: 2 }),
          },
        );
        const data = await createRes.json();
        matchID = data.matchID;

        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}?player=${currentPlayerID}&matchID=${matchID}`,
        );
      }

      const joinRes = await fetch(
        `http://localhost:8000/games/catan/${matchID}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerID: currentPlayerID,
            playerName: `Player ${currentPlayerID}`,
          }),
        },
      );

      if (!joinRes.ok) {
        console.error("Join failed. Seat might be taken or matchID invalid.");
        return;
      }

      const joinData = await joinRes.json();
      setMatchData({
        matchID,
        playerID: currentPlayerID,
        credentials: joinData.playerCredentials,
      });
    }

    initGame();
  }, [currentPlayerID, existingMatchID]);

  if (!matchData) return <div>Syncing Match...</div>;

  return (
    <CatanClient
      matchID={matchData.matchID}
      playerID={matchData.playerID}
      credentials={matchData.credentials}
    />
  );
}
