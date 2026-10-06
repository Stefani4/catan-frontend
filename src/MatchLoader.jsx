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
import { useTranslation } from "./i18n.js";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function SyncingLoader() {
  const { t } = useTranslation();
  return <div>{t("syncingWithServer")}</div>;
}

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
  const { t } = useTranslation();
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
      loading: SyncingLoader,
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

  // Same idea as enterMatch, but also carries the reconstituted bots list —
  // used after a rematch, where bots need fresh credentials in the new match.
  const enterMatchWithBots = (id, seat, creds, total, newBots, screen = "lobby") => {
    setMatchID(id);
    setNumPlayers(total);
    setMySeat(seat);
    setCredentials(creds);
    setBots(newBots);
    updateUrl(id, seat);
    setScreen(screen);
    saveMatchSession({ matchID: id, numPlayers: total, mySeat: seat, credentials: creds, screen, bots: newBots });
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
        setError(t("errMatchNotFound"));
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
      setError(t("errFull"));
    } catch {
      setError(t("errReachServer"));
    }
  };

  const joinExactSeat = async (id, seat) => {
    setError(null);
    const infoRes = await fetch(`${SERVER}/games/catan/${id}`).catch(() => null);
    const total = infoRes && infoRes.ok ? (await infoRes.json()).players?.length : 4;

    const result = await joinSeat(id, seat, total || 4);
    if (!result) {
      setError(t("errJoinSeat"));
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
          setError(t("errSessionGone"));
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
      setError(t("errReachServerWithUrl", { url: SERVER }));
    } finally {
      setCreatePickerOpen(false);
      setPendingPlayerCount(null);
    }
  };

  const startRematch = async ({ oldMatchID, mySeat: seat, numPlayers: total, settings, bots: oldBots }) => {
    setError(null);
    try {
      let info = await fetch(`${SERVER}/games/catan/${oldMatchID}/rematch`).then((r) =>
          r.ok ? r.json() : null,
      );

      if (!info) {
        const createRes = await fetch(`${SERVER}/games/catan/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numPlayers: total, setupData: settings }),
        });
        if (!createRes.ok) throw new Error();
        const created = await createRes.json();

        const proposeRes = await fetch(`${SERVER}/games/catan/${oldMatchID}/rematch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newMatchID: created.matchID, proposedBy: seat }),
        });
        if (!proposeRes.ok) throw new Error();
        info = await proposeRes.json();
      }

      const weProposed = String(info.proposedBy) === String(seat);

      const result = await joinSeat(info.newMatchID, seat, total);
      if (!result) throw new Error();

      // Only the player whose proposal actually won re-adds the bots, so two
      // simultaneous "Rematch" clicks don't double-seat the AI opponents.
      let newBots = [];
      if (weProposed && oldBots && oldBots.length) {
        for (const bot of oldBots) {
          const res = await fetch(`${SERVER}/games/catan/${info.newMatchID}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerID: bot.seat,
              playerName: encodePlayerIdentity({ name: bot.name || "Bot", isBot: true }),
            }),
          }).catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            newBots.push({
              seat: bot.seat,
              name: bot.name,
              credentials: data.playerCredentials,
              difficulty: bot.difficulty,
            });
          }
        }
      }

      // If every other seat in the match is a bot (solo-vs-bots rematch),
      // there's no one else to wait for — skip the lobby and jump straight
      // back into the game instead of requiring an extra "Start Game" click.
      const allOtherSeatsAreBots = weProposed && oldBots && newBots.length === total - 1;
      const nextScreen = allOtherSeatsAreBots ? "game" : "lobby";

      enterMatchWithBots(info.newMatchID, result.seat, result.credentials, total, newBots, nextScreen);
    } catch {
      setError(t("errStartRematch"));
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
          <CatanClient
              matchID={matchID}
              playerID={mySeat}
              credentials={credentials}
              bots={bots}
              onRematch={startRematch}
          />
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
                      <h3 style={{ marginTop: 0 }}>{t("couldntJoin")}</h3>
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
                        {t("close")}
                      </button>
                    </>
                ) : pendingPlayerCount === null ? (
                    <>
                      <h3 style={{ marginTop: 0 }}>{t("howManySettlers")}</h3>
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
                      <p style={{ fontSize: "0.8rem", color: "#5a4326" }}>{t("playersInMatch")}</p>
                    </>
                ) : (
                    <>
                      <h3 style={{ marginTop: 0, marginBottom: "2px" }}>{t("advancedRules")}</h3>
                      <p style={{ fontSize: "0.8rem", color: "#5a4326", marginTop: 0 }}>
                        {t("playersSetRules", { n: pendingPlayerCount })}
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
                          {t("setupBack")}
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
                          {t("createLobby")}
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