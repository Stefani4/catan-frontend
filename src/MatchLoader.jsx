import { useEffect, useState, useMemo } from "react";
import { Client } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import Board from "./components/Board";
import { CatanGame } from "../game/CatanGame.js";
import { normalizeGameSettings } from "../game/constants.js";
import MainMenu from "./MainMenu.jsx";
import { encodePlayerIdentity, subscribeToProfile } from "./profileStore.js";
import LobbyRoom from "./LobbyRoom.jsx";
import GameSetupModal from "./GameSetupModal.jsx";
import { toMatchDefaults } from "./settingsStore.js";
import { saveMatchSession, loadMatchSession, clearMatchSession } from "./matchSession.js";
import BotManager from "./bots/BotManager.jsx";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function extractMatchID(input) {
  try {
    const url = new URL(input);
    const fromQuery = new URLSearchParams(url.search).get("matchID");
    if (fromQuery) return fromQuery;
  } catch {
  }
  return input.trim();
}

export default function MatchLoader() {
  const [screen, setScreen] = useState("menu");
  const [error, setError] = useState(null);
  const [matchID, setMatchID] = useState(null);
  const [numPlayers, setNumPlayers] = useState(4);
  const [mySeat, setMySeat] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [createPickerOpen, setCreatePickerOpen] = useState(false);
  const [pendingPlayerCount, setPendingPlayerCount] = useState(null);
  const [bots, setBots] = useState([]);
  const [matchSettings, setMatchSettings] = useState(() =>
      normalizeGameSettings(toMatchDefaults()),
  );

  useEffect(() => {
    if (!matchID || mySeat === null || !credentials) return undefined;

    let debounceTimer = null;
    const unsubscribe = subscribeToProfile((profile) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetch(`${SERVER}/games/catan/${matchID}/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerID: mySeat,
            credentials,
            newName: encodePlayerIdentity(profile),
          }),
        }).catch(() => {});
      }, 400);
    });

    return () => {
      clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [matchID, mySeat, credentials]);

  const CatanClient = useMemo(() => {
    return Client({
      game: CatanGame,
      board: Board,
      multiplayer: SocketIO({ server: SERVER }),
      debug: false,
      loading: () => <div>Syncing with server...</div>,
    });
  }, []);

  const updateUrl = (id, seat) => {
    const q = seat !== null ? `?matchID=${id}&player=${seat}` : `?matchID=${id}`;
    window.history.replaceState({}, "", `${window.location.pathname}${q}`);
  };

  const joinSeat = async (id, seat, playersCount) => {
    try {
      const res = await fetch(`${SERVER}/games/catan/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerID: seat, playerName: encodePlayerIdentity() }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { seat, credentials: data.playerCredentials };
    } catch {
      return null;
    }
  };

  const enterMatch = (id, seat, creds, total, screen = "lobby") => {
    setMatchID(id);
    setNumPlayers(total);
    setMySeat(seat);
    setCredentials(creds);
    updateUrl(id, seat);
    setScreen(screen);
    saveMatchSession({ matchID: id, numPlayers: total, mySeat: seat, credentials: creds, screen, bots: [] });
  };

  const updateBots = (nextBots) => {
    setBots(nextBots);
    saveMatchSession({ matchID, numPlayers, mySeat, credentials, screen, bots: nextBots });
  };

  const joinNextOpenSeat = async (id) => {
    setError(null);
    try {
      const infoRes = await fetch(`${SERVER}/games/catan/${id}`);
      if (!infoRes.ok) {
        setError("That match could not be found. Check the link/code and try again.");
        return;
      }
      const info = await infoRes.json();
      const total = info.players?.length || 4;

      for (let seat = 0; seat < total; seat++) {
        const already = info.players.find((p) => String(p.id) === String(seat) && p.name);
        if (already) continue;
        const result = await joinSeat(id, String(seat), total);
        if (result) {
          enterMatch(id, result.seat, result.credentials, total);
          return;
        }
      }
      setError("This match is full.");
    } catch {
      setError("Could not reach the game server.");
    }
  };

  const joinExactSeat = async (id, seat) => {
    setError(null);
    const infoRes = await fetch(`${SERVER}/games/catan/${id}`).catch(() => null);
    const total = infoRes && infoRes.ok ? (await infoRes.json()).players?.length : 4;

    const result = await joinSeat(id, seat, total || 4);
    if (!result) {
      setError("Could not join that seat — it may already be taken, or the match may not exist.");
      return;
    }
    enterMatch(id, result.seat, result.credentials, total || 4);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMatchID = params.get("matchID");
    const urlPlayer = params.get("player");

    const session = loadMatchSession();
    if (session && (!urlMatchID || urlMatchID === session.matchID)) {
      (async () => {
        const infoRes = await fetch(`${SERVER}/games/catan/${session.matchID}`).catch(() => null);
        if (!infoRes || !infoRes.ok) {
          clearMatchSession();
          setError("Your previous match is no longer available on the server.");
          return;
        }
        setMatchID(session.matchID);
        setNumPlayers(session.numPlayers);
        setMySeat(session.mySeat);
        setCredentials(session.credentials);
        setBots(session.bots || []);
        updateUrl(session.matchID, session.mySeat);
        setScreen(session.screen === "game" ? "game" : "lobby");
      })();
      return;
    }

    if (!urlMatchID) return;
    if (urlPlayer !== null) {
      joinExactSeat(urlMatchID, urlPlayer);
    } else {
      joinNextOpenSeat(urlMatchID);
    }
  }, []);

  const createMatch = async (players, settings) => {
    setError(null);
    try {
      const res = await fetch(`${SERVER}/games/catan/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numPlayers: players, setupData: settings }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const result = await joinSeat(data.matchID, "0", players);
      if (!result) throw new Error();

      enterMatch(data.matchID, result.seat, result.credentials, players);
    } catch {
      setError("Could not reach the game server. Is it running at " + SERVER + "?");
    } finally {
      setCreatePickerOpen(false);
      setPendingPlayerCount(null);
    }
  };

  const leaveToMenu = () => {
    clearMatchSession();
    setMatchID(null);
    setMySeat(null);
    setCredentials(null);
    setBots([]);
    setError(null);
    window.history.replaceState({}, "", window.location.pathname);
    setScreen("menu");
  };

  if (screen === "game" && matchID && mySeat !== null) {
    return (
        <>
          <CatanClient matchID={matchID} playerID={mySeat} credentials={credentials} />
          <BotManager matchID={matchID} bots={bots} />
        </>
    );
  }

  if (screen === "lobby" && matchID) {
    return (
        <LobbyRoom
            matchID={matchID}
            numPlayers={numPlayers}
            mySeat={mySeat}
            credentials={credentials}
            onLeave={leaveToMenu}
            bots={bots}
            onBotsChange={updateBots}
            onStart={() => {
              setScreen("game");
              saveMatchSession({ matchID, numPlayers, mySeat, credentials, screen: "game", bots });
            }}
        />
    );
  }

  return (
      <>
        <MainMenu
            onCreateLobby={() => setCreatePickerOpen(true)}
            onJoinLobby={(codeOrLink) => joinNextOpenSeat(extractMatchID(codeOrLink))}
        />

        {(createPickerOpen || error) && (
            <div
                onClick={() => {
                  setCreatePickerOpen(false);
                  setPendingPlayerCount(null);
                  setError(null);
                }}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 60,
                }}
            >
              <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                    border: "3px solid #7a5320",
                    borderRadius: "12px",
                    padding: "26px 30px",
                    color: "#3a2409",
                    fontFamily: "Georgia, serif",
                    textAlign: "center",
                    maxWidth: error || pendingPlayerCount === null ? "340px" : "420px",
                    maxHeight: "85vh",
                    overflowY: "auto",
                  }}
              >
                {error ? (
                    <>
                      <h3 style={{ marginTop: 0 }}>⚠️ Couldn't join</h3>
                      <p style={{ fontSize: "0.9rem" }}>{error}</p>
                      <button
                          onClick={() => setError(null)}
                          style={{
                            marginTop: "8px",
                            padding: "8px 18px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#7a5320",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                      >
                        Close
                      </button>
                    </>
                ) : pendingPlayerCount === null ? (
                    <>
                      <h3 style={{ marginTop: 0 }}>How many settlers?</h3>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "14px 0" }}>
                        {[2, 3, 4].map((n) => (
                            <button
                                key={n}
                                onClick={() => setPendingPlayerCount(n)}
                                style={{
                                  width: "56px",
                                  height: "56px",
                                  borderRadius: "10px",
                                  border: "2px solid #7a5320",
                                  background: "linear-gradient(135deg, #8a5a20, #c9922f)",
                                  color: "white",
                                  fontWeight: "bold",
                                  fontSize: "1.2rem",
                                  cursor: "pointer",
                                }}
                            >
                              {n}
                            </button>
                        ))}
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#5a4326" }}>Players in this match</p>
                    </>
                ) : (
                    <>
                      <h3 style={{ marginTop: 0, marginBottom: "2px" }}>Advanced Rules</h3>
                      <p style={{ fontSize: "0.8rem", color: "#5a4326", marginTop: 0 }}>
                        {pendingPlayerCount} players — set the rules for this match
                      </p>
                      <GameSetupModal settings={matchSettings} onChange={setMatchSettings} />
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
                        <button
                            onClick={() => setPendingPlayerCount(null)}
                            style={{
                              padding: "10px 18px",
                              borderRadius: "8px",
                              border: "2px solid #7a5320",
                              background: "rgba(255,255,255,0.4)",
                              color: "#3a2409",
                              fontFamily: "Georgia, serif",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                        >
                          ← Back
                        </button>
                        <button
                            onClick={() => createMatch(pendingPlayerCount, matchSettings)}
                            style={{
                              padding: "10px 24px",
                              borderRadius: "8px",
                              border: "2px solid #f1d38a",
                              background: "linear-gradient(135deg, #8a5a20, #c9922f)",
                              color: "white",
                              fontFamily: "Georgia, serif",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                        >
                          Create Lobby
                        </button>
                      </div>
                    </>
                )}
              </div>
            </div>
        )}
      </>
  );
}
