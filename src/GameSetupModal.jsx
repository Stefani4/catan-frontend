import {
    VICTORY_POINTS_OPTIONS,
    MAP_TYPES,
    DICE_MODES,
} from "../game/constants.js";
import { useState } from "react";
import { useTranslation } from "./i18n.js";
import BoardEditor from "./components/BoardEditor.jsx";

const cardStyle = {
    border: "2px solid #7a5320",
    borderRadius: "8px",
    padding: "8px 10px",
    background: "rgba(255,255,255,0.25)",
};

const SHAPE_ICON = {
    hexagon: "⬡",
    rectangle: "▭",
    triangle: "▲",
};

const labelStyle = {
    fontSize: "0.7rem",
    fontWeight: "bold",
    color: "#5a4326",
    marginBottom: "5px",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    whiteSpace: "nowrap",
};

function Pill({ active, disabled, onClick, children, title }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            title={title}
            style={{
                padding: "5px 10px",
                borderRadius: "999px",
                border: `2px solid ${active ? "#7a5320" : "rgba(122,83,32,0.4)"}`,
                background: active
                    ? "linear-gradient(135deg, #8a5a20, #c9922f)"
                    : "rgba(255,255,255,0.4)",
                color: active ? "white" : "#5a4326",
                fontWeight: active ? "bold" : "normal",
                fontFamily: "Georgia, serif",
                fontSize: "0.72rem",
                cursor: disabled ? "default" : "pointer",
                opacity: disabled && !active ? 0.5 : 1,
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </button>
    );
}

function Toggle({ label, checked, onChange, disabled, hint }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
            }}
        >
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.78rem", color: "#3a2409" }}>{label}</div>
                {hint && (
                    <div style={{ fontSize: "0.62rem", color: "#8a7458", fontStyle: "italic", lineHeight: 1.25 }}>
                        {hint}
                    </div>
                )}
            </div>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(!checked)}
                style={{
                    width: "38px",
                    height: "20px",
                    borderRadius: "999px",
                    border: "2px solid #7a5320",
                    background: checked ? "#7a5320" : "rgba(255,255,255,0.5)",
                    position: "relative",
                    cursor: disabled ? "default" : "pointer",
                    flexShrink: 0,
                }}
            >
        <span
            style={{
                position: "absolute",
                top: "1px",
                left: checked ? "18px" : "1px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: checked ? "#f1d38a" : "#7a5320",
                transition: "left 0.15s ease",
            }}
        />
            </button>
        </div>
    );
}

export default function GameSetupModal({ settings, onChange, readOnly }) {
    const { t } = useTranslation();
    const [editorOpen, setEditorOpen] = useState(false);
    const set = (patch) => onChange && onChange({ ...settings, ...patch });
    const disabled = readOnly || !onChange;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ ...cardStyle, flex: "1 1 140px" }}>
                    <span style={labelStyle}>🏆 {t("victoryPoints")}</span>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {VICTORY_POINTS_OPTIONS.map((v) => (
                            <Pill
                                key={v}
                                active={settings.victoryPointsTarget === v}
                                disabled={disabled}
                                onClick={() => set({ victoryPointsTarget: v })}
                                title={v > 10 ? t("longerGame") : t("standardGame")}
                            >
                                {v}
                            </Pill>
                        ))}
                    </div>
                </div>

                <div style={{ ...cardStyle, flex: "1 1 140px" }}>
                    <span style={labelStyle}>🗺️ {t("boardShape")}</span>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {Object.entries(MAP_TYPES).map(([key, cfg]) => (
                            <Pill
                                key={key}
                                active={settings.mapType === key}
                                disabled={disabled}
                                onClick={() => set({ mapType: key })}
                                title={t("tilesCount", { n: cfg.hexCount })}
                            >
                                {key === "custom" ? "🎨" : SHAPE_ICON[cfg.shape] || "🗺️"} {t(`mapType_${key}`)}
                            </Pill>
                        ))}
                    </div>
                    {settings.mapType === "custom" && !disabled && (
                        <button
                            type="button"
                            onClick={() => setEditorOpen(true)}
                            style={{
                                marginTop: "8px",
                                width: "100%",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "2px solid #7a5320",
                                background: settings.customBoard
                                    ? "rgba(46,107,62,0.25)"
                                    : "rgba(255,255,255,0.4)",
                                color: "#3a2409",
                                fontWeight: "bold",
                                fontFamily: "Georgia, serif",
                                fontSize: "0.72rem",
                                cursor: "pointer",
                            }}
                        >
                            {settings.customBoard ? t("customBoardActive") : t("editBoardBtn")}
                        </button>
                    )}
                    {settings.mapType === "custom" && disabled && settings.customBoard && (
                        <p style={{ margin: "8px 0 0 0", fontSize: "0.68rem", color: "#2e6b3e", fontWeight: "bold" }}>
                            {t("customBoardActive")}
                        </p>
                    )}
                </div>
            </div>

            {editorOpen && (
                <BoardEditor
                    initialBoard={settings.customBoard}
                    onCancel={() => setEditorOpen(false)}
                    onSave={(customBoard) => {
                        set({ mapType: "custom", customBoard });
                        setEditorOpen(false);
                    }}
                />
            )}

            <div style={cardStyle}>
                <span style={labelStyle}>🎲 {t("diceMechanism")}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                    {Object.entries(DICE_MODES).map(([key, cfg]) => (
                        <Pill
                            key={key}
                            active={settings.diceMode === key}
                            disabled={disabled}
                            onClick={() => set({ diceMode: key })}
                        >
                            {t(`diceMode_${key}`)}
                        </Pill>
                    ))}
                </div>
            </div>

            <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "7px" }}>
                <span style={labelStyle}>⚙️ {t("optionalRules")}</span>
                <Toggle
                    label={t("seasonsLabel")}
                    hint={t("seasonsHint")}
                    checked={settings.seasonsEnabled}
                    disabled={disabled}
                    onChange={(v) => set({ seasonsEnabled: v })}
                />
                <Toggle
                    label={t("payToClearRobberLabel")}
                    hint={t("payToClearRobberSettingHint")}
                    checked={settings.robberPayToClear}
                    disabled={disabled}
                    onChange={(v) => set({ robberPayToClear: v })}
                />
                <Toggle
                    label={t("resortLabel")}
                    hint={t("resortHint")}
                    checked={settings.resortEnabled}
                    disabled={disabled}
                    onChange={(v) => set({ resortEnabled: v })}
                />
            </div>
        </div>
    );
}