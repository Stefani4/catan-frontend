import { PLAYER_COLORS } from "../constants/playerColors.js";
import { AVATARS } from "../constants/avatars.jsx";

export default function ProfileMenu({ profile, onChange }) {
    const color = PLAYER_COLORS[profile.colorIndex] ?? PLAYER_COLORS[0];

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                marginTop: "10px",
                width: "280px",
                background: "linear-gradient(160deg, #e8d9b0, #d8c391)",
                border: "3px solid #7a5320",
                borderRadius: "14px",
                boxShadow: "0 12px 26px rgba(0,0,0,0.55)",
                padding: "16px",
                fontFamily: "Georgia, serif",
                color: "#3a2409",
            }}
        >
            <div style={{ fontWeight: "bold", fontSize: "0.95rem", marginBottom: "8px" }}>
                Your name
            </div>
            <input
                autoFocus
                value={profile.name}
                maxLength={20}
                onChange={(e) => onChange({ name: e.target.value })}
                style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #7a5320",
                    background: "rgba(255,255,255,0.5)",
                    color: "#3a2409",
                    fontFamily: "Georgia, serif",
                    fontWeight: "bold",
                    marginBottom: "14px",
                }}
            />

            <div style={{ fontWeight: "bold", fontSize: "0.95rem", marginBottom: "8px" }}>
                Piece color
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "8px",
                    marginBottom: "14px",
                }}
            >
                {PLAYER_COLORS.map((c, idx) => (
                    <div
                        key={c.name}
                        onClick={() => onChange({ colorIndex: idx })}
                        title={c.name}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            aspectRatio: "1",
                            borderRadius: "8px",
                            cursor: "pointer",
                            background: `radial-gradient(circle at 30% 30%, ${c.soft}, ${c.accent})`,
                            border: idx === profile.colorIndex ? "3px solid #3a2409" : "2px solid rgba(0,0,0,0.25)",
                            boxShadow: idx === profile.colorIndex ? "0 0 0 2px #f1d38a inset" : "none",
                        }}
                    />
                ))}
            </div>

            <div style={{ fontWeight: "bold", fontSize: "0.95rem", marginBottom: "8px" }}>
                Avatar
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "8px",
                }}
            >
                {AVATARS.map((a) => {
                    const isSelected = a.id === profile.avatarId;
                    return (
                        <div
                            key={a.id}
                            onClick={() => onChange({ avatarId: a.id })}
                            title={a.label}
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                aspectRatio: "1",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: isSelected
                                    ? `radial-gradient(circle at 30% 30%, ${color.soft}, ${color.accent})`
                                    : "rgba(255,255,255,0.4)",
                                border: isSelected ? "3px solid #3a2409" : "2px solid rgba(0,0,0,0.2)",
                            }}
                        >
                            <a.Icon size={18} color={isSelected ? "#f2e6c9" : "#3a2409"} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}