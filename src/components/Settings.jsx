import { useState, useEffect, useRef } from "react";
import { getSavedPlayerName, NAME_KEY } from "../MainMenu.jsx";
import catanLogo from "../../images/catanlogo.png";
import { loadSettings, saveSettings } from "../settingsStore.js";
import { THEME_OPTIONS, getThemeImage } from "../theme.js";
import {
    VICTORY_POINTS_OPTIONS,
    MAP_TYPES,
    DICE_MODES,
} from "../../game/constants.js";


const colors = {
    ink: "#3a2409",
    inkSoft: "#5a4326",
    gold: "#c9a96e",
    goldLight: "#f1d38a",
    panelA: "#e8d9b0",
    panelB: "#d8c391",
    wood: "#7a5320",
    woodDark: "#4a3115",
};

function Label({ children }) {
    return (
        <div
            style={{
                fontFamily: "Georgia, serif",
                fontWeight: "bold",
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
                color: colors.inkSoft,
                textTransform: "uppercase",
                marginBottom: "6px",
                marginTop: "16px",
                borderBottom: `1px solid ${colors.gold}`,
                paddingBottom: "4px",
            }}
        >
            {children}
        </div>
    );
}

function Select({ value, onChange, options, renderLabel }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: `1.5px solid ${colors.gold}`,
                background: "#fbf3dd",
                color: colors.ink,
                fontFamily: "Georgia, serif",
                fontWeight: "bold",
                fontSize: "0.85rem",
                cursor: "pointer",
            }}
        >
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {renderLabel ? renderLabel(opt) : opt}
                </option>
            ))}
        </select>
    );
}

function Toggle({ value, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            aria-pressed={value}
            style={{
                width: "52px",
                height: "28px",
                borderRadius: "999px",
                border: `1.5px solid ${colors.gold}`,
                background: value
                    ? "linear-gradient(135deg, #6f9950, #4c7a34)"
                    : "rgba(0,0,0,0.25)",
                position: "relative",
                cursor: "pointer",
                padding: 0,
                transition: "background 0.15s ease-out",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: "2px",
                    left: value ? "26px" : "2px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#fbf3dd",
                    border: `1px solid ${colors.gold}`,
                    transition: "left 0.15s ease-out",
                }}
            />
        </button>
    );
}

function Row({ label, children }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "10px",
            }}
        >
      <span
          style={{
              fontFamily: "Georgia, serif",
              fontSize: "0.85rem",
              color: colors.ink,
          }}
      >
        {label}
      </span>
            {children}
        </div>
    );
}

function Slider({ value, onChange }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "56%" }}>
            <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{
                    flex: 1,
                    accentColor: colors.wood,
                    cursor: "pointer",
                }}
            />
            <span
                style={{
                    fontFamily: "Georgia, serif",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                    color: colors.inkSoft,
                    width: "28px",
                    textAlign: "right",
                }}
            >
        {value}
      </span>
        </div>
    );
}


function GeneralSection({ settings, update }) {
    return (
        <div>
            <Label>Language</Label>
            <Select
                value={settings.language}
                onChange={(v) => update("language", v)}
                options={["English", "Español", "Français", "Deutsch", "Português"]}
            />

            <Label>Theme</Label>
            <Select
                value={settings.theme}
                onChange={(v) => update("theme", v)}
                options={THEME_OPTIONS.map((t) => t.key)}
                renderLabel={(key) => THEME_OPTIONS.find((t) => t.key === key)?.label ?? key}
            />
            <div
                style={{
                    marginTop: "8px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: `1.5px solid ${colors.gold}`,
                    height: "80px",
                    backgroundImage: `url(${getThemeImage(settings.theme)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: "background-image 0.2s ease-out",
                }}
            />
            <p style={{ ...sectionHintStyle, marginTop: "6px", textAlign: "left" }}>
                Sets the Main Menu &amp; Lobby backdrop.
            </p>

            <div style={{ marginTop: "18px" }}>
                <Row label="Animations">
                    <Toggle value={settings.animations} onChange={(v) => update("animations", v)} />
                </Row>
                <Row label="Tutorial Hints">
                    <Toggle value={settings.tutorialHints} onChange={(v) => update("tutorialHints", v)} />
                </Row>
            </div>

            <p style={sectionHintStyle}>Adjust the basics.</p>
        </div>
    );
}

function GameplaySection({ settings, update }) {
    return (
        <div>
            <Label>Victory Points to Win</Label>
            <Select
                value={String(settings.victoryPointsTarget)}
                onChange={(v) => update("victoryPointsTarget", Number(v))}
                options={VICTORY_POINTS_OPTIONS.map(String)}
            />

            <Label>Default Map Size</Label>
            <Select
                value={settings.mapType}
                onChange={(v) => update("mapType", v)}
                options={Object.keys(MAP_TYPES)}
                renderLabel={(key) => `${MAP_TYPES[key].label} (${MAP_TYPES[key].hexCount} tiles)`}
            />

            <Label>Dice Mechanism</Label>
            <Select
                value={settings.diceMode}
                onChange={(v) => update("diceMode", v)}
                options={Object.keys(DICE_MODES)}
                renderLabel={(key) => DICE_MODES[key].label}
            />

            <Label>Turn Timer</Label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                    type="number"
                    min="0"
                    step="10"
                    value={settings.turnTimer}
                    onChange={(e) => update("turnTimer", Number(e.target.value))}
                    style={{
                        width: "80px",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: `1.5px solid ${colors.gold}`,
                        background: "#fbf3dd",
                        color: colors.ink,
                        fontFamily: "Georgia, serif",
                        fontWeight: "bold",
                    }}
                />
                <span style={{ fontFamily: "Georgia, serif", fontSize: "0.8rem", color: colors.inkSoft }}>
          Seconds to act on your turn
        </span>
            </div>

            <div style={{ marginTop: "18px" }}>
                <Row label="Seasons">
                    <Toggle value={settings.seasonsEnabled} onChange={(v) => update("seasonsEnabled", v)} />
                </Row>
                <Row label="Pay to Clear Robber">
                    <Toggle value={settings.robberPayToClear} onChange={(v) => update("robberPayToClear", v)} />
                </Row>
                <Row label="Resort">
                    <Toggle value={settings.resortEnabled} onChange={(v) => update("resortEnabled", v)} />
                </Row>
            </div>

            <p style={sectionHintStyle}>
                These become the defaults a new match opens with — you can still adjust them per-lobby.
            </p>
        </div>
    );
}

function AudioSection({ settings, update }) {
    return (
        <div>
            <Row label="Master Volume">
                <Slider value={settings.masterVolume} onChange={(v) => update("masterVolume", v)} />
            </Row>
            <Row label="Music Volume">
                <Slider value={settings.musicVolume} onChange={(v) => update("musicVolume", v)} />
            </Row>
            <Row label="Sound Effects">
                <Slider value={settings.soundEffects} onChange={(v) => update("soundEffects", v)} />
            </Row>
            <Row label="Ambient Volume">
                <Slider value={settings.ambientVolume} onChange={(v) => update("ambientVolume", v)} />
            </Row>
            <Row label="Voice Chat">
                <Toggle value={settings.voiceChat} onChange={(v) => update("voiceChat", v)} />
            </Row>

            <p style={sectionHintStyle}>Fine-tune the sounds.</p>
        </div>
    );
}

function VideoSection({ settings, update }) {
    useEffect(() => {
        const onChange = () => update("fullscreen", Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFullscreenToggle = async (next) => {
        try {
            if (next) {
                await document.documentElement.requestFullscreen?.();
            } else {
                await document.exitFullscreen?.();
            }
        } catch {
        }
        update("fullscreen", Boolean(document.fullscreenElement));
    };

    return (
        <div>
            <Label>Graphics Quality</Label>
            <Select
                value={settings.graphicsQuality}
                onChange={(v) => update("graphicsQuality", v)}
                options={["Low", "Medium", "High"]}
            />

            <div style={{ marginTop: "18px" }}>
                <Row label="Fullscreen">
                    <Toggle value={settings.fullscreen} onChange={handleFullscreenToggle} />
                </Row>
                <Row label="Show FPS">
                    <Toggle value={settings.showFps} onChange={(v) => update("showFps", v)} />
                </Row>
            </div>

            <p style={sectionHintStyle}>Tune how the board looks.</p>
        </div>
    );
}

function ControlsSection({ settings, update }) {
    return (
        <div>
            <Row label="Camera Sensitivity">
                <Slider value={settings.cameraSensitivity} onChange={(v) => update("cameraSensitivity", v)} />
            </Row>
            <Row label="Invert Camera">
                <Toggle value={settings.invertCamera} onChange={(v) => update("invertCamera", v)} />
            </Row>

            <Label>Keybinds</Label>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "0.8rem", color: colors.inkSoft, lineHeight: 1.9 }}>
                <div>Roll Dice — <b>Space</b></div>
                <div>End Turn — <b>Enter</b></div>
                <div>Open Trade — <b>T</b></div>
                <div>Open Chat — <b>C</b></div>
            </div>

            <p style={sectionHintStyle}>Customize how you play.</p>
        </div>
    );
}

function AccountSection({ playerName, onChangeName }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(playerName);

    const linkedIcons = [
        { key: "steam", label: "Steam", emoji: "🎮" },
        { key: "google", label: "Google", emoji: "🟢" },
        { key: "discord", label: "Discord", emoji: "💬" },
    ];

    return (
        <div>
            <Label>Player Name</Label>
            {editing ? (
                <div style={{ display: "flex", gap: "8px" }}>
                    <input
                        autoFocus
                        value={draft}
                        maxLength={20}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                onChangeName(draft.trim() || playerName);
                                setEditing(false);
                            }
                        }}
                        style={{
                            flex: 1,
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: `1.5px solid ${colors.gold}`,
                            background: "#fbf3dd",
                            color: colors.ink,
                            fontFamily: "Georgia, serif",
                            fontWeight: "bold",
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            onChangeName(draft.trim() || playerName);
                            setEditing(false);
                        }}
                        style={{ ...applyBtnStyle, padding: "8px 14px" }}
                    >
                        Save
                    </button>
                </div>
            ) : (
                <Select value={playerName} onChange={() => {}} options={[playerName]} />
            )}

            {!editing && (
                <button type="button" onClick={() => { setDraft(playerName); setEditing(true); }} style={secondaryBtnStyle}>
                    Change Name
                </button>
            )}

            <Label>Linked Accounts</Label>
            <div style={{ display: "flex", gap: "10px" }}>
                {linkedIcons.map((i) => (
                    <div
                        key={i.key}
                        title={i.label}
                        style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            border: `1.5px solid ${colors.gold}`,
                            background: "#fbf3dd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.1rem",
                        }}
                    >
                        {i.emoji}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                    type="button"
                    onClick={() => window.alert("You have been logged out.")}
                    style={secondaryBtnStyle}
                >
                    Log Out
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                            window.alert("Account deletion requested.");
                        }
                    }}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#8a2f1f",
                        fontFamily: "Georgia, serif",
                        fontSize: "0.75rem",
                        textDecoration: "underline",
                        cursor: "pointer",
                        padding: "4px",
                    }}
                >
                    Delete Account
                </button>
            </div>
        </div>
    );
}

const sectionHintStyle = {
    marginTop: "20px",
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
    fontSize: "0.75rem",
    color: colors.inkSoft,
    textAlign: "center",
};

const secondaryBtnStyle = {
    marginTop: "10px",
    width: "100%",
    padding: "9px 10px",
    borderRadius: "6px",
    border: `1.5px solid ${colors.gold}`,
    background: "rgba(0,0,0,0.06)",
    color: colors.ink,
    fontFamily: "Georgia, serif",
    fontWeight: "bold",
    fontSize: "0.8rem",
    cursor: "pointer",
};

const applyBtnStyle = {
    border: `2px solid ${colors.goldLight}`,
    background: "linear-gradient(135deg, #8a5a20, #c9922f)",
    color: "white",
    fontFamily: "Georgia, serif",
    fontWeight: "bold",
    borderRadius: "8px",
    cursor: "pointer",
};

/* ---------- nav ---------- */

const NAV_ITEMS = [
    { key: "general", label: "General", icon: "⚙" },
    { key: "gameplay", label: "Gameplay", icon: "🎮" },
    { key: "audio", label: "Audio", icon: "🔊" },
    { key: "video", label: "Video", icon: "🖥" },
    { key: "controls", label: "Controls", icon: "🕹" },
    { key: "account", label: "Account", icon: "👤" },
];

function NavButton({ active, icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                marginBottom: "8px",
                borderRadius: "8px",
                border: `1.5px solid ${active ? colors.goldLight : "transparent"}`,
                background: active
                    ? "linear-gradient(135deg, #8a5a20, #c9922f)"
                    : "rgba(0,0,0,0.08)",
                color: active ? "#fff" : colors.ink,
                fontFamily: "Georgia, serif",
                fontWeight: "bold",
                fontSize: "0.85rem",
                cursor: "pointer",
                textAlign: "left",
            }}
        >
            <span style={{ fontSize: "1rem" }}>{icon}</span>
            {label}
        </button>
    );
}


export default function Settings({ onClose }) {
    const [settings, setSettings] = useState(loadSettings);
    const [active, setActive] = useState("general");
    const [playerName, setPlayerName] = useState(getSavedPlayerName());
    const [savedFlash, setSavedFlash] = useState(false);
    const flashTimeout = useRef(null);

    useEffect(() => {
        return () => clearTimeout(flashTimeout.current);
    }, []);

    const update = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleChangeName = (newName) => {
        setPlayerName(newName);
        localStorage.setItem(NAME_KEY, newName);
    };

    const handleApply = () => {
        saveSettings(settings);
        setSavedFlash(true);
        clearTimeout(flashTimeout.current);
        flashTimeout.current = setTimeout(() => setSavedFlash(false), 1600);
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                padding: "20px",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "min(920px, 96vw)",
                    maxHeight: "90vh",
                    overflow: "hidden",
                    borderRadius: "16px",
                    border: `4px solid ${colors.wood}`,
                    background: "linear-gradient(160deg, #efe2bd, #ddc99a)",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* header */}
                <div
                    style={{
                        position: "relative",
                        padding: "18px 26px",
                        borderBottom: `3px solid ${colors.wood}`,
                        background: "linear-gradient(180deg, #8a5a20, #6b4218)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <img src={catanLogo} alt="" style={{ height: "22px", position: "absolute", left: "22px", opacity: 0.85 }} />
                    <h2
                        style={{
                            margin: 0,
                            fontFamily: "Georgia, serif",
                            letterSpacing: "0.12em",
                            color: colors.goldLight,
                            textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                        }}
                    >
                        SETTINGS
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close settings"
                        style={{
                            position: "absolute",
                            right: "18px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            border: `1.5px solid ${colors.goldLight}`,
                            background: "rgba(0,0,0,0.35)",
                            color: colors.goldLight,
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
                    <div
                        style={{
                            width: "190px",
                            flexShrink: 0,
                            padding: "18px 14px",
                            borderRight: `3px solid ${colors.wood}`,
                            background: "rgba(0,0,0,0.05)",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            {NAV_ITEMS.map((item) => (
                                <NavButton
                                    key={item.key}
                                    icon={item.icon}
                                    label={item.label}
                                    active={active === item.key}
                                    onClick={() => setActive(item.key)}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                marginTop: "10px",
                                padding: "9px 14px",
                                borderRadius: "8px",
                                border: `1.5px solid ${colors.gold}`,
                                background: "rgba(0,0,0,0.08)",
                                color: colors.ink,
                                fontFamily: "Georgia, serif",
                                fontWeight: "bold",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                            }}
                        >
                            ‹ Back
                        </button>
                    </div>

                    <div style={{ flex: 1, padding: "22px 28px", overflowY: "auto" }}>
                        {active === "general" && <GeneralSection settings={settings} update={update} />}
                        {active === "gameplay" && <GameplaySection settings={settings} update={update} />}
                        {active === "audio" && <AudioSection settings={settings} update={update} />}
                        {active === "video" && <VideoSection settings={settings} update={update} />}
                        {active === "controls" && <ControlsSection settings={settings} update={update} />}
                        {active === "account" && (
                            <AccountSection playerName={playerName} onChangeName={handleChangeName} />
                        )}
                    </div>
                </div>

                <div
                    style={{
                        padding: "14px 26px",
                        borderTop: `3px solid ${colors.wood}`,
                        background: "rgba(0,0,0,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "14px",
                    }}
                >
                    {savedFlash && (
                        <span style={{ fontFamily: "Georgia, serif", fontSize: "0.8rem", color: "#4c7a34", fontWeight: "bold" }}>
              Settings saved ✓
            </span>
                    )}
                    <button type="button" onClick={handleApply} style={{ ...applyBtnStyle, padding: "10px 24px" }}>
                        ✔ Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
