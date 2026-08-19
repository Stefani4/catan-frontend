import {
    VICTORY_POINTS_OPTIONS,
    MAP_TYPES,
    DICE_MODES,
} from "../game/constants.js";

const cardStyle = {
    border: "2px solid #7a5320",
    borderRadius: "8px",
    padding: "8px 10px",
    background: "rgba(255,255,255,0.25)",
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
            <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ ...cardStyle, flex: 1 }}>
                    <span style={labelStyle}>🏆 Victory Points</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                        {VICTORY_POINTS_OPTIONS.map((v) => (
                            <Pill
                                key={v}
                                active={settings.victoryPointsTarget === v}
                                disabled={disabled}
                                onClick={() => set({ victoryPointsTarget: v })}
                                title={v > 10 ? "Longer game" : "Standard"}
                            >
                                {v}
                            </Pill>
                        ))}
                    </div>
                </div>

                <div style={{ ...cardStyle, flex: 1 }}>
                    <span style={labelStyle}>🗺️ Map Size</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                        {Object.entries(MAP_TYPES).map(([key, cfg]) => (
                            <Pill
                                key={key}
                                active={settings.mapType === key}
                                disabled={disabled}
                                onClick={() => set({ mapType: key })}
                                title={`${cfg.hexCount} tiles`}
                            >
                                {cfg.label}
                            </Pill>
                        ))}
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                <span style={labelStyle}>🎲 Dice Mechanism</span>
                <div style={{ display: "flex", gap: "6px" }}>
                    {Object.entries(DICE_MODES).map(([key, cfg]) => (
                        <Pill
                            key={key}
                            active={settings.diceMode === key}
                            disabled={disabled}
                            onClick={() => set({ diceMode: key })}
                        >
                            {cfg.label}
                        </Pill>
                    ))}
                </div>
            </div>

            <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "7px" }}>
                <span style={labelStyle}>⚙️ Optional Rules</span>
                <Toggle
                    label="Seasons"
                    hint="Spring/Summer/Autumn/Winter modify production"
                    checked={settings.seasonsEnabled}
                    disabled={disabled}
                    onChange={(v) => set({ seasonsEnabled: v })}
                />
                <Toggle
                    label="Pay to Clear Robber"
                    hint="Pay 1 of each resource to reset the Robber"
                    checked={settings.robberPayToClear}
                    disabled={disabled}
                    onChange={(v) => set({ robberPayToClear: v })}
                />
                <Toggle
                    label="Resort"
                    hint="Seize an opponent's city — can't be taken back"
                    checked={settings.resortEnabled}
                    disabled={disabled}
                    onChange={(v) => set({ resortEnabled: v })}
                />
            </div>
        </div>
    );
}
