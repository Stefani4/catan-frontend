import { useState, useEffect, useRef } from "react";
import { getSavedPlayerName, NAME_KEY } from "../MainMenu.jsx";
import catanLogo from "../../images/catanlogo.png";
import { loadSettings, saveSettings } from "../settingsStore.js";
import { useTranslation, LANGUAGE_OPTIONS } from "../i18n.js";
import { playSfx } from "../audio/soundEngine.js";
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

function Slider({ value, onChange, onPreview }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "56%" }}>
            <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                onPointerUp={onPreview}
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
    const { t } = useTranslation();
    return (
        <div>
            <Label>{t("language")}</Label>
            <Select
                value={settings.language}
                onChange={(v) => update("language", v)}
                options={LANGUAGE_OPTIONS}
            />

            <Label>{t("theme")}</Label>
            <Select
                value={settings.theme}
                onChange={(v) => update("theme", v)}
                options={THEME_OPTIONS.map((opt) => opt.key)}
                renderLabel={(key) => THEME_OPTIONS.find((opt) => opt.key === key)?.label ?? key}
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
                {t("themeHint")}
            </p>

            <div style={{ marginTop: "18px" }}>
                <Row label={t("animations")}>
                    <Toggle value={settings.animations} onChange={(v) => update("animations", v)} />
                </Row>
                <Row label={t("tutorialHints")}>
                    <Toggle value={settings.tutorialHints} onChange={(v) => update("tutorialHints", v)} />
                </Row>
            </div>

            <p style={sectionHintStyle}>Adjust the basics.</p>
        </div>
    );
}

function GameplaySection({ settings, update }) {
    const { t } = useTranslation();
    return (
        <div>
            <Label>{t("victoryPointsToWin")}</Label>
            <Select
                value={String(settings.victoryPointsTarget)}
                onChange={(v) => update("victoryPointsTarget", Number(v))}
                options={VICTORY_POINTS_OPTIONS.map(String)}
            />

            <Label>{t("defaultBoardShape")}</Label>
            <Select
                value={settings.mapType}
                onChange={(v) => update("mapType", v)}
                options={Object.keys(MAP_TYPES)}
                renderLabel={(key) => `${t(`mapType_${key}`)} (${t("tilesCount", { n: MAP_TYPES[key].hexCount })})`}
            />

            <Label>{t("diceMechanism")}</Label>
            <Select
                value={settings.diceMode}
                onChange={(v) => update("diceMode", v)}
                options={Object.keys(DICE_MODES)}
                renderLabel={(key) => t(`diceMode_${key}`)}
            />

            <Label>{t("turnTimerLabel")}</Label>
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
          {t("secondsToAct")}
        </span>
            </div>

            <div style={{ marginTop: "18px" }}>
                <Row label={t("seasonsLabel")}>
                    <Toggle value={settings.seasonsEnabled} onChange={(v) => update("seasonsEnabled", v)} />
                </Row>
                <Row label={t("payToClearRobberLabel")}>
                    <Toggle value={settings.robberPayToClear} onChange={(v) => update("robberPayToClear", v)} />
                </Row>
                <Row label={t("resortLabel")}>
                    <Toggle value={settings.resortEnabled} onChange={(v) => update("resortEnabled", v)} />
                </Row>
            </div>

            <p style={sectionHintStyle}>
                {t("gameplayDefaultsHint")}
            </p>
        </div>
    );
}

function AudioSection({ settings, update }) {
    const { t } = useTranslation();
    const preview = () => playSfx("click");
    return (
        <div>
            <Row label={t("muteAllAudio")}>
                <Toggle value={settings.muted} onChange={(v) => update("muted", v)} />
            </Row>
            <Row label={t("masterVolumeLabel")}>
                <Slider value={settings.masterVolume} onChange={(v) => update("masterVolume", v)} onPreview={preview} />
            </Row>
            <Row label={t("musicVolumeLabel")}>
                <Slider value={settings.musicVolume} onChange={(v) => update("musicVolume", v)} />
            </Row>
            <Row label={t("soundEffectsLabel")}>
                <Slider value={settings.soundEffects} onChange={(v) => update("soundEffects", v)} onPreview={preview} />
            </Row>
            <Row label={t("ambientVolumeLabel")}>
                <Slider value={settings.ambientVolume} onChange={(v) => update("ambientVolume", v)} />
            </Row>
            <Row label={t("voiceChatLabel")}>
                <Toggle value={settings.voiceChat} onChange={(v) => update("voiceChat", v)} />
            </Row>

            <p style={sectionHintStyle}>{t("audioHint")}</p>
        </div>
    );
}

function VideoSection({ settings, update }) {
    const { t } = useTranslation();
    useEffect(() => {
        const onChange = () => update("fullscreen", Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
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

    const QUALITY_LABEL = { Low: t("qualityLow"), Medium: t("qualityMedium"), High: t("qualityHigh") };

    return (
        <div>
            <Label>{t("graphicsQualityLabel")}</Label>
            <Select
                value={settings.graphicsQuality}
                onChange={(v) => update("graphicsQuality", v)}
                options={["Low", "Medium", "High"]}
                renderLabel={(key) => QUALITY_LABEL[key] ?? key}
            />

            <div style={{ marginTop: "18px" }}>
                <Row label={t("fullscreenLabel")}>
                    <Toggle value={settings.fullscreen} onChange={handleFullscreenToggle} />
                </Row>
                <Row label={t("showFpsLabel")}>
                    <Toggle value={settings.showFps} onChange={(v) => update("showFps", v)} />
                </Row>
            </div>

            <p style={sectionHintStyle}>{t("videoHint")}</p>
        </div>
    );
}

function ControlsSection({ settings, update }) {
    const { t } = useTranslation();
    return (
        <div>
            <Row label={t("cameraSensitivityLabel")}>
                <Slider value={settings.cameraSensitivity} onChange={(v) => update("cameraSensitivity", v)} />
            </Row>
            <Row label={t("invertCameraLabel")}>
                <Toggle value={settings.invertCamera} onChange={(v) => update("invertCamera", v)} />
            </Row>

            <Label>{t("keybindsLabel")}</Label>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "0.8rem", color: colors.inkSoft, lineHeight: 1.9 }}>
                <div>{t("rollDiceBind")} — <b>Space</b></div>
                <div>{t("endTurnBind")} — <b>Enter</b></div>
                <div>{t("openTradeBind")} — <b>T</b></div>
                <div>{t("openChatBind")} — <b>C</b></div>
            </div>

            <p style={sectionHintStyle}>{t("controlsHint")}</p>
        </div>
    );
}

function AccountSection({ playerName, onChangeName }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(playerName);
    const { t } = useTranslation();

    const linkedIcons = [
        { key: "steam", label: "Steam", emoji: "🎮" },
        { key: "google", label: "Google", emoji: "🟢" },
        { key: "discord", label: "Discord", emoji: "💬" },
    ];

    return (
        <div>
            <Label>{t("playerNameLabel")}</Label>
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
                        {t("saveBtn")}
                    </button>
                </div>
            ) : (
                <Select value={playerName} onChange={() => {}} options={[playerName]} />
            )}

            {!editing && (
                <button type="button" onClick={() => { setDraft(playerName); setEditing(true); }} style={secondaryBtnStyle}>
                    {t("changeNameBtn")}
                </button>
            )}

            <Label>{t("linkedAccountsLabel")}</Label>
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
                    onClick={() => window.alert(t("loggedOutAlert"))}
                    style={secondaryBtnStyle}
                >
                    {t("logOutBtn")}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm(t("deleteConfirm"))) {
                            window.alert(t("deleteRequestedAlert"));
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
                    {t("deleteAccountBtn")}
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


function navItems(t) {
    return [
        { key: "general", label: t("navGeneral"), icon: "⚙" },
        { key: "gameplay", label: t("navGameplay"), icon: "🎮" },
        { key: "audio", label: t("navAudio"), icon: "🔊" },
        { key: "video", label: t("navVideo"), icon: "🖥" },
        { key: "controls", label: t("navControls"), icon: "🕹" },
        { key: "account", label: t("navAccount"), icon: "👤" },
    ];
}

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
    const { t } = useTranslation();
    const [settings, setSettings] = useState(loadSettings);
    const [active, setActive] = useState("general");
    const [playerName, setPlayerName] = useState(getSavedPlayerName());
    const [savedFlash, setSavedFlash] = useState(false);
    const flashTimeout = useRef(null);

    useEffect(() => {
        return () => clearTimeout(flashTimeout.current);
    }, []);

    const update = (key, value) => {
        // Save as a plain side effect *after* triggering the re-render, not
        // inside the setState updater function — updater functions must be
        // pure. Calling saveSettings() in there dispatches a settings-changed
        // event synchronously mid-render, which is what caused React's
        // "Cannot update a component while rendering a different component"
        // warning and made some subscribers (like language) update unreliably.
        setSettings((prev) => ({ ...prev, [key]: value }));
        saveSettings({ ...loadSettings(), [key]: value });
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
                        {t("settingsTitle")}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("closeSettingsAria")}
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
                            {navItems(t).map((item) => (
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
                            {t("back")}
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
              {t("savedFlash")}
            </span>
                    )}
                    <button type="button" onClick={handleApply} style={{ ...applyBtnStyle, padding: "10px 24px" }}>
                        {t("apply")}
                    </button>
                </div>
            </div>
        </div>
    );
}