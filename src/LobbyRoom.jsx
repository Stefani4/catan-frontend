import { useEffect, useState, useRef } from "react";
import catanLogo from "../images/catanlogo.png";
import { getColorByIndex, PLAYER_COLORS } from "./constants/playerColors.js";

import { getAvatarById, AVATARS } from "./constants/avatars.jsx";
import GameSetupModal from "./GameSetupModal.jsx";
import { GAME_SETTINGS_DEFAULTS } from "../game/constants.js";
import { getThemeImage } from "./theme.js";
import { subscribeToSettings } from "./settingsStore.js";
import { botDisplayName } from "./bots/botNames.js";
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from "./bots/botEngine.js";
import { useTranslation } from "./i18n.js";

function difficultyMeta(t) {
    return {
        easy: { label: t("botEasy"), emoji: "🌱", blurb: t("botEasyBlurb") },
        medium: { label: t("botMedium"), emoji: "⚖️", blurb: t("botMediumBlurb") },
        hard: { label: t("botHard"), emoji: "🔥", blurb: t("botHardBlurb") },
    };
}
import { loadProfile, subscribeToProfile, saveProfile, decodePlayerIdentity, encodePlayerIdentity } from "./profileStore.js";
import ProfileMenu from "./components/ProfileMenu.jsx";
import { useViewportSize } from "./hooks/useViewportSize.js";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";



function AdvancedRulesPanel({ matchID, isMobile }) {
    const { t } = useTranslation();
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`${SERVER}/games/catan/${matchID}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data) {
                    setSettings({ ...GAME_SETTINGS_DEFAULTS, ...(data.setupData || {}) });
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [matchID]);

    return (
        <div
            style={{
                width: isMobile ? "100%" : "360px",
                maxWidth: "360px",
                borderRadius: "14px",
                border: "3px solid #7a5320",
                background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                padding: "14px 16px",
                fontFamily: "Georgia, serif",
                color: "#3a2409",
                boxSizing: "border-box",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "1.05rem",
                    marginBottom: "10px",
                    borderBottom: "2px solid #7a5320",
                    paddingBottom: "6px",
                }}
            >
                📜 {t("advancedRules")}
            </div>
            {settings ? (
                <GameSetupModal settings={settings} readOnly />
            ) : (
                <p style={{ textAlign: "center", fontSize: "0.85rem", fontStyle: "italic" }}>
                    {t("loadingRules")}
                </p>
            )}
            <p style={{ fontSize: "0.62rem", color: "#8a7458", fontStyle: "italic", marginTop: "8px", marginBottom: 0, textAlign: "center" }}>
                {t("lockedByHost")}
            </p>
        </div>
    );
}

function SettlersPanel({ matchID, numPlayers, mySeat, players, bots, onCopyLink, isMobile }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const DIFFICULTY_META = difficultyMeta(t);

    const copy = () => {
        onCopyLink();
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div
            style={{
                width: isMobile ? "100%" : "230px",
                maxWidth: "360px",
                borderRadius: "14px",
                border: "3px solid #7a5320",
                background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                padding: "16px",
                fontFamily: "Georgia, serif",
                color: "#3a2409",
                boxSizing: "border-box",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "1.15rem",
                    marginBottom: "12px",
                    borderBottom: "2px solid #7a5320",
                    paddingBottom: "8px",
                }}
            >
                {t("settlers")}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Array.from({ length: numPlayers }, (_, i) => String(i)).map((seat) => {
                    const joined = players.find((p) => String(p.id) === seat && p.name);
                    const identity = joined ? decodePlayerIdentity(joined.name, seat) : null;
                    const color = getColorByIndex(identity ? identity.colorIndex : (parseInt(seat, 10) % 9));
                    const AvatarIcon = identity?.avatarId ? getAvatarById(identity.avatarId).Icon : null;
                    const isMe = seat === mySeat;
                    const botInfo = (bots || []).find((b) => String(b.seat) === seat);
                    return (
                        <div
                            key={seat}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "5px 8px",
                                borderRadius: "8px",
                                background: isMe ? "rgba(122,83,32,0.18)" : "transparent",
                            }}
                        >
              <span
                  style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: joined
                          ? `radial-gradient(circle at 30% 30%, ${color.soft}, ${color.accent})`
                          : "rgba(0,0,0,0.15)",
                      border: "1px solid rgba(0,0,0,0.3)",
                      flexShrink: 0,
                  }}
              >
                  {joined && AvatarIcon && <AvatarIcon size={13} color="#f2e6c9" />}
              </span>
                            <span
                                style={{
                                    fontSize: "0.9rem",
                                    fontStyle: joined ? "normal" : "italic",
                                    color: joined ? "#3a2409" : "#8a7458",
                                    fontWeight: isMe ? "bold" : "normal",
                                }}
                            >
                {joined ? identity.name : t("waitingForPlayer", { seat })}
                                {isMe ? ` ${t("you")}` : ""}
              </span>
                            {botInfo && (
                                <span
                                    style={{
                                        fontSize: "0.62rem",
                                        color: "#7a5320",
                                        background: "rgba(122,83,32,0.15)",
                                        borderRadius: "999px",
                                        padding: "1px 7px",
                                        fontWeight: "bold",
                                        flexShrink: 0,
                                    }}
                                >
                                    {DIFFICULTY_META[botInfo.difficulty || DEFAULT_DIFFICULTY].emoji}{" "}
                                    {DIFFICULTY_META[botInfo.difficulty || DEFAULT_DIFFICULTY].label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <button
                onClick={copy}
                style={{
                    width: "100%",
                    marginTop: "14px",
                    padding: "9px",
                    borderRadius: "8px",
                    border: "2px solid #7a5320",
                    background: copied ? "#a8c98a" : "#7a5320",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                }}
            >
                {copied ? t("copied") : t("copyLink")}
            </button>
        </div>
    );
}

function BotsPanel({ matchID, openSeats, botCount, addingBots, onAddBots, isMobile }) {
    const { t } = useTranslation();
    const DIFFICULTY_META = difficultyMeta(t);
    const [selected, setSelected] = useState(0);
    const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);
    const maxBots = openSeats.length;

    useEffect(() => {
        setSelected((s) => Math.min(s, maxBots));
    }, [maxBots]);

    if (maxBots === 0) return null;

    return (
        <div
            style={{
                width: isMobile ? "100%" : "230px",
                maxWidth: "360px",
                borderRadius: "14px",
                border: "3px solid #7a5320",
                background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                padding: "16px",
                fontFamily: "Georgia, serif",
                color: "#3a2409",
                boxSizing: "border-box",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "1.05rem",
                    marginBottom: "10px",
                    borderBottom: "2px solid #7a5320",
                    paddingBottom: "8px",
                }}
            >
                {t("playVsBots")}
            </div>

            <p style={{ fontSize: "0.72rem", color: "#5a4326", marginTop: 0 }}>
                {t("fillOpenSeats", { n: maxBots, s: maxBots === 1 ? "" : "s" })}
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", margin: "10px 0" }}>
                {Array.from({ length: maxBots + 1 }, (_, i) => i).map((n) => (
                    <button
                        key={n}
                        onClick={() => setSelected(n)}
                        disabled={addingBots}
                        style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "8px",
                            border: `2px solid ${selected === n ? "#7a5320" : "rgba(122,83,32,0.4)"}`,
                            background: selected === n
                                ? "linear-gradient(135deg, #8a5a20, #c9922f)"
                                : "rgba(255,255,255,0.4)",
                            color: selected === n ? "white" : "#5a4326",
                            fontWeight: "bold",
                            cursor: addingBots ? "default" : "pointer",
                        }}
                    >
                        {n}
                    </button>
                ))}
            </div>

            <div style={{ margin: "2px 0 12px" }}>
                <p style={{ fontSize: "0.68rem", color: "#5a4326", margin: "0 0 6px", textAlign: "center" }}>
                    {t("difficulty")}
                </p>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                    {DIFFICULTIES.map((level) => (
                        <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            disabled={addingBots}
                            title={DIFFICULTY_META[level].blurb}
                            style={{
                                flex: 1,
                                padding: "6px 4px",
                                borderRadius: "8px",
                                border: `2px solid ${difficulty === level ? "#7a5320" : "rgba(122,83,32,0.4)"}`,
                                background: difficulty === level
                                    ? "linear-gradient(135deg, #8a5a20, #c9922f)"
                                    : "rgba(255,255,255,0.4)",
                                color: difficulty === level ? "white" : "#5a4326",
                                fontWeight: "bold",
                                fontSize: "0.72rem",
                                cursor: addingBots ? "default" : "pointer",
                                fontFamily: "Georgia, serif",
                            }}
                        >
                            {DIFFICULTY_META[level].emoji} {DIFFICULTY_META[level].label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => onAddBots(selected, difficulty)}
                disabled={selected === 0 || addingBots}
                style={{
                    width: "100%",
                    padding: "9px",
                    borderRadius: "8px",
                    border: "2px solid #7a5320",
                    background: selected === 0 || addingBots ? "#4a4a4a" : "#7a5320",
                    color: "white",
                    fontWeight: "bold",
                    cursor: selected === 0 || addingBots ? "not-allowed" : "pointer",
                    fontFamily: "Georgia, serif",
                    opacity: selected === 0 || addingBots ? 0.65 : 1,
                }}
            >
                {addingBots
                    ? t("adding")
                    : t("addBots", { n: selected || "", s: selected === 1 ? "" : "s" }).trim()}
            </button>

            {botCount > 0 && (
                <p style={{ fontSize: "0.68rem", color: "#5a4326", textAlign: "center", marginBottom: 0 }}>
                    {t("botsSeated", { n: botCount, s: botCount === 1 ? "" : "s" })}
                </p>
            )}
        </div>
    );
}

function LobbyChat({ matchID, isMobile }) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const listRef = useRef(null);
    const [profile, setProfile] = useState(loadProfile());

    useEffect(() => subscribeToProfile(setProfile), []);

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages.length]);

    useEffect(() => {
        if (!matchID) return;
        let cancelled = false;

        const poll = () => {
            fetch(`${SERVER}/games/catan/${matchID}/chat`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (!cancelled && Array.isArray(data)) setMessages(data);
                })
                .catch(() => {});
        };

        poll();
        const interval = setInterval(poll, 2000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [matchID]);

    const send = () => {
        const text = draft.trim();
        if (!text || !matchID) return;
        setDraft("");
        fetch(`${SERVER}/games/catan/${matchID}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: profile.name, text }),
        }).catch(() => {});
    };

    return (
        <div
            style={{
                width: isMobile ? "100%" : "300px",
                maxWidth: "360px",
                borderRadius: "14px",
                border: "3px solid #7a5320",
                background: "linear-gradient(160deg, #f1e4bf, #e2cd9c)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                overflow: "hidden",
                fontFamily: "Georgia, serif",
                color: "#3a2409",
                boxSizing: "border-box",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    textAlign: "center",
                    padding: "10px",
                    borderBottom: "2px solid #7a5320",
                }}
            >
                {t("chat")}
            </div>
            <div
                ref={listRef}
                style={{
                    height: "150px",
                    overflowY: "auto",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                }}
            >
                {messages.length === 0 && (
                    <div style={{ fontStyle: "italic", fontSize: "0.8rem", color: "#8a7458", textAlign: "center", marginTop: "16px" }}>
                        {t("noMessagesYet")}
                    </div>
                )}
                {messages.map((m) => (
                    <div key={m.id} style={{ fontSize: "0.82rem" }}>
                        <b>{m.name}:</b> {m.text}
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: "6px", padding: "10px", borderTop: "2px solid #7a5320" }}>
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={t("typeMessageHere")}
                    style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #7a5320",
                        background: "rgba(255,255,255,0.5)",
                        color: "#3a2409",
                        fontFamily: "Georgia, serif",
                    }}
                />
                <button
                    onClick={send}
                    style={{
                        padding: "7px 12px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#7a5320",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    ➤
                </button>
            </div>
        </div>
    );
}

export default function LobbyRoom({ matchID, numPlayers, mySeat, onLeave, onStart, bots, onBotsChange }) {
    const { t } = useTranslation();
    const viewport = useViewportSize();
    const isMobile = viewport.width < 820;
    const [profile, setProfile] = useState(loadProfile());
    const [players, setPlayers] = useState([]);
    const [theme, setTheme] = useState("sunset");
    const [addingBots, setAddingBots] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileChipRef = useRef(null);

    useEffect(() => {
        if (!profileMenuOpen) return;
        const handleClickOutside = (e) => {
            if (profileChipRef.current && !profileChipRef.current.contains(e.target)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [profileMenuOpen]);

    useEffect(() => subscribeToProfile(setProfile), []);
    useEffect(() => subscribeToSettings((s) => setTheme(s.theme)), []);

    useEffect(() => {
        let cancelled = false;

        async function poll() {
            try {
                const res = await fetch(`${SERVER}/games/catan/${matchID}`);
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) setPlayers(data.players || []);
            } catch (e) {
            }
        }

        poll();
        const interval = setInterval(poll, 2000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [matchID]);

    const joinedCount = players.filter((p) => p.name).length;
    const canStart = joinedCount >= 2;

    const takenSeats = new Set(players.filter((p) => p.name).map((p) => String(p.id)));
    const openSeats = Array.from({ length: numPlayers }, (_, i) => String(i)).filter(
        (seat) => !takenSeats.has(seat),
    );

    const addBots = async (count, difficulty = DEFAULT_DIFFICULTY) => {
        if (count <= 0 || addingBots) return;
        setAddingBots(true);
        const seatsToFill = openSeats.slice(0, count);
        const existingBots = bots || [];
        const newBots = [];

        const usedColorIdx = new Set();
        const usedAvatarId = new Set();
        players.filter((p) => p.name).forEach((p) => {
            const identity = decodePlayerIdentity(p.name, p.id);
            usedColorIdx.add(identity.colorIndex);
            if (identity.avatarId) usedAvatarId.add(identity.avatarId);
        });
        existingBots.forEach((b) => {
            const identity = decodePlayerIdentity(b.name, b.seat);
            usedColorIdx.add(identity.colorIndex);
            if (identity.avatarId) usedAvatarId.add(identity.avatarId);
        });

        const pickRandomColorIndex = (used) => {
            const allIdx = PLAYER_COLORS.map((_, idx) => idx);
            const free = allIdx.filter((idx) => !used.has(idx));
            const pool = free.length > 0 ? free : allIdx;
            return pool[Math.floor(Math.random() * pool.length)];
        };
        const pickRandomAvatar = () => {
            const free = AVATARS.filter((a) => !usedAvatarId.has(a.id));
            const pool = free.length > 0 ? free : AVATARS;
            return pool[Math.floor(Math.random() * pool.length)];
        };

        for (let i = 0; i < seatsToFill.length; i++) {
            const seat = seatsToFill[i];
            const botName = botDisplayName(existingBots.length + i);
            const colorIndex = pickRandomColorIndex(usedColorIdx);
            usedColorIdx.add(colorIndex);
            const avatar = pickRandomAvatar();
            usedAvatarId.add(avatar.id);
            const identity = encodePlayerIdentity({ name: botName, colorIndex, avatarId: avatar.id });
            try {
                const res = await fetch(`${SERVER}/games/catan/${matchID}/join`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ playerID: seat, playerName: identity }),
                });
                if (res.ok) {
                    const data = await res.json();
                    newBots.push({ seat, name: identity, credentials: data.playerCredentials, difficulty });
                }
            } catch {
            }
        }

        if (newBots.length > 0) {
            onBotsChange?.([...existingBots, ...newBots]);
        }
        setAddingBots(false);
    };

    const copyLink = () => {
        const url = `${window.location.origin}${window.location.pathname}?matchID=${matchID}`;
        navigator.clipboard?.writeText(url).catch(() => {});
    };

    return (
        <div
            style={{
                height: "100vh",
                width: "100vw",
                position: "relative",
                backgroundImage: `url(${getThemeImage(theme)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                overflow: "hidden",
                paddingTop: "14px",
                boxSizing: "border-box",
            }}
        >
            <div ref={profileChipRef} style={{ position: "absolute", top: "18px", left: "18px", zIndex: 20 }}>
                <div
                    onClick={() => setProfileMenuOpen((o) => !o)}
                    title={t("editProfileTooltip")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "rgba(20,14,6,0.6)",
                        border: `2px solid ${profileMenuOpen ? getColorByIndex(profile.colorIndex).soft : "#c9a96e"}`,
                        borderRadius: "999px",
                        padding: "6px 16px 6px 6px",
                        cursor: "pointer",
                        userSelect: "none",
                    }}
                >
                    <div
                        style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: `radial-gradient(circle at 30% 30%, ${getColorByIndex(profile.colorIndex).soft}, ${getColorByIndex(profile.colorIndex).accent})`,
                            border: "2px solid #f1d38a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        {(() => {
                            const AvatarIcon = getAvatarById(profile.avatarId).Icon;
                            return <AvatarIcon size={18} color="#f2e6c9" />;
                        })()}
                    </div>
                    <span style={{ color: "#f2e6c9", fontWeight: "bold", fontFamily: "Georgia, serif" }}>
            {profile.name} ✎
        </span>
                </div>

                {profileMenuOpen && (
                    <ProfileMenu
                        profile={profile}
                        onChange={(partial) => setProfile(saveProfile(partial))}
                    />
                )}
            </div>

            <img
                src={catanLogo}
                alt="Catan"
                style={{
                    width: isMobile ? "min(150px, 34vw)" : "min(220px, 30vw)",
                    marginBottom: isMobile ? "8px" : "12px",
                    flexShrink: 0,
                }}
            />

            <div
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    width: "100%",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "center",
                    alignItems: isMobile ? "center" : "flex-start",
                    gap: isMobile ? "12px" : "20px",
                    padding: isMobile ? "0 14px" : "0 30px",
                    boxSizing: "border-box",
                    overflowY: isMobile ? "auto" : "hidden",
                    overflowX: "hidden",
                    WebkitOverflowScrolling: "touch",
                }}
            >
                <LobbyChat matchID={matchID} isMobile={isMobile} />
                <AdvancedRulesPanel matchID={matchID} isMobile={isMobile} />
                <SettlersPanel matchID={matchID} numPlayers={numPlayers} mySeat={mySeat} players={players} bots={bots} onCopyLink={copyLink} isMobile={isMobile} />
                <BotsPanel
                    matchID={matchID}
                    openSeats={openSeats}
                    botCount={(bots || []).length}
                    addingBots={addingBots}
                    onAddBots={addBots}
                    isMobile={isMobile}
                />
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    margin: "14px 0",
                    flexShrink: 0,
                }}
            >
                <div style={{ display: "flex", gap: "16px" }}>
                    <button
                        onClick={onLeave}
                        style={{
                            padding: "12px 26px",
                            borderRadius: "8px",
                            border: "2px solid #c9a96e",
                            background: "rgba(20,14,6,0.75)",
                            color: "#f2e6c9",
                            fontFamily: "Georgia, serif",
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                    >
                        {t("leave")}
                    </button>
                    <button
                        onClick={onStart}
                        disabled={!canStart}
                        title={canStart ? undefined : t("needTwoPlayers")}
                        style={{
                            padding: "12px 32px",
                            borderRadius: "8px",
                            border: `2px solid ${canStart ? "#f1d38a" : "#666"}`,
                            background: canStart
                                ? "linear-gradient(135deg, #8a5a20, #c9922f)"
                                : "#4a4a4a",
                            color: "white",
                            fontFamily: "Georgia, serif",
                            fontWeight: "bold",
                            fontSize: "1.05rem",
                            cursor: canStart ? "pointer" : "not-allowed",
                            opacity: canStart ? 1 : 0.65,
                        }}
                    >
                        {t("startGame")}
                    </button>
                </div>
                {!canStart && (
                    <span style={{ fontSize: "0.78rem", color: "#f2e6c9", fontStyle: "italic", textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}>
            {t("waitingForPlayers", { joined: joinedCount, total: numPlayers })}
          </span>
                )}
            </div>
        </div>
    );
}