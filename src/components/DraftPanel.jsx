import { useEffect, useRef, useState } from "react";
import { DRAFT_CONFIG } from "../../game/constants.js";
import { bestDraftCard, getCurrentPack, hasPickedThisRound } from "../../game/draft.js";
import { usePlayerIdentities } from "../hooks/usePlayerIdentities.js";
import { useTranslation } from "../i18n.js";
import { getColorByIndex } from "../constants/playerColors.js";
import brickCard from "../../images/brickCard.png";
import lumberCard from "../../images/lumberCard.png";
import grainCard from "../../images/grainCard.png";
import woolCard from "../../images/woolCard.png";
import oreCard from "../../images/oreCard.png";
import desertimg from "../../images/desert.png";
import fieldsimg from "../../images/field.png";
import forestimg from "../../images/forest.png";
import hillsimg from "../../images/hills.png";
import mountainsimg from "../../images/mountain.png";
import pastureimg from "../../images/pasture.png";

const RES_IMG = { brick: brickCard, lumber: lumberCard, grain: grainCard, wool: woolCard, ore: oreCard };
const TERRAIN_IMG = { hills: hillsimg, forest: forestimg, fields: fieldsimg, pasture: pastureimg, mountains: mountainsimg, desert: desertimg };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const RARITY_COLOR = { common: "#c9a96e", rare: "#f1c40f" };

export function DraftCard({ card, onPick, onHover, disabled, compact }) {
    const { t } = useTranslation();
    const border = card.kind === "resources" ? RARITY_COLOR[card.rarity] : "#7fd1a0";
    const w = compact ? 74 : 124;

    return (
        <button
            type="button"
            data-testid={`draft-card-${card.id}`}
            disabled={disabled}
            onClick={() => onPick && onPick(card.id)}
            onMouseEnter={() => card.kind === "hex" && onHover && onHover(card.hexId)}
            onMouseLeave={() => onHover && onHover(null)}
            onFocus={() => card.kind === "hex" && onHover && onHover(card.hexId)}
            onBlur={() => onHover && onHover(null)}
            style={{
                width: w,
                padding: compact ? "4px" : "8px",
                borderRadius: "10px",
                border: `2px solid ${border}`,
                background: "linear-gradient(160deg, #2c1e0e, #1c1208)",
                color: "#f2e6c9",
                fontFamily: "Georgia, serif",
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.6 : 1,
                boxShadow: card.rarity === "rare" ? "0 0 10px rgba(241,196,15,0.55)" : "0 2px 6px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                flexShrink: 0,
            }}
        >
            <div style={{ fontSize: compact ? "0.55rem" : "0.65rem", textTransform: "uppercase", letterSpacing: "0.5px", color: border }}>
                {card.kind === "hex" ? t("draftCardHex") : card.rarity === "rare" ? t("draftCardRare") : t("draftCardResources")}
            </div>

            {card.kind === "hex" ? (
                <>
                    <div
                        style={{
                            width: compact ? 44 : 78,
                            height: compact ? 44 : 78,
                            backgroundImage: `url(${TERRAIN_IMG[card.terrain]})`,
                            backgroundSize: "cover",
                            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span style={{ background: "#fff", color: "#000", borderRadius: "50%", width: compact ? 18 : 28, height: compact ? 18 : 28, fontWeight: "bold", fontSize: compact ? "0.6rem" : "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {card.number}
                        </span>
                    </div>
                    <div style={{ fontSize: compact ? "0.6rem" : "0.78rem", fontWeight: "bold" }}>{t(`terrain${cap(card.terrain)}`)}</div>
                    {!compact && <div style={{ fontSize: "0.62rem", color: "#c9a96e", textAlign: "center" }}>{t("draftHexBonus", { n: DRAFT_CONFIG.hexClaimBonus })}</div>}
                </>
            ) : (
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", justifyContent: "center", minHeight: compact ? 0 : 78, alignContent: "center" }}>
                        {Object.entries(card.resources).map(([res, n]) => (
                            <div key={res} title={t(`res${cap(res)}`)} style={{ position: "relative" }}>
                                <img src={RES_IMG[res]} alt={res} style={{ width: compact ? 22 : 34, height: compact ? 30 : 46, objectFit: "cover", borderRadius: 3 }} />
                                <span style={{ position: "absolute", right: -3, bottom: -3, background: "#000c", borderRadius: 8, padding: "0 4px", fontSize: compact ? "0.55rem" : "0.7rem", fontWeight: "bold" }}>×{n}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: compact ? "0.58rem" : "0.74rem", fontWeight: "bold", textAlign: "center" }}>{t(`bundle_${card.bundleId}`)}</div>
                </>
            )}
        </button>
    );
}

export default function DraftPanel({ G, moves, playerID, matchID, onHoverHex, isMobile }) {
    const { t } = useTranslation();
    const identities = usePlayerIdentities(matchID);
    const draft = G.draft;
    const me = playerID === undefined || playerID === null ? null : String(playerID);

    const pack = me ? getCurrentPack(draft, me) : null;
    const picked = me ? hasPickedThisRound(draft, me) : false;
    // Countdown is keyed by round, so a new round starts fresh without an
    // effect having to reset state.
    const round = draft?.round ?? 0;
    const [clock, setClock] = useState({ round, left: DRAFT_CONFIG.pickSeconds });
    const timeLeft = clock.round === round ? clock.left : DRAFT_CONFIG.pickSeconds;

    // Keep the freshest values for the interval callback without re-arming it.
    const latest = useRef({});
    useEffect(() => {
        latest.current = { pack, picked, moves, me };
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setClock((prev) => {
                const left = (prev.round === round ? prev.left : DRAFT_CONFIG.pickSeconds) - 1;
                if (left <= 0) {
                    if (prev.round === round && prev.left <= 0) return prev; // already auto-picked
                    const { pack: p, picked: done, moves: m, me: who } = latest.current;
                    if (who && !done && p?.cards?.length) {
                        const auto = bestDraftCard(p);
                        setTimeout(() => m.draftPick?.(auto.id), 0);
                    }
                    return { round, left: 0 };
                }
                return { round, left };
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [round]);

    if (!draft) return null;

    const myPicks = me ? draft.picks[me] || [] : [];
    const status = draft.order.map((pid) => {
        const idn = identities[pid];
        return {
            pid,
            name: idn?.name || `Player ${pid}`,
            color: getColorByIndex(idn ? idn.colorIndex : parseInt(pid, 10) % 9).soft,
            done: hasPickedThisRound(draft, pid),
        };
    });

    return (
        <div
            data-testid="draft-panel"
            style={{
                position: "fixed",
                left: "50%",
                bottom: isMobile ? "4px" : "18px",
                transform: "translateX(-50%)",
                width: isMobile ? "calc(100vw - 12px)" : "min(780px, calc(100vw - 640px))",
                minWidth: isMobile ? 0 : "520px",
                maxHeight: isMobile ? "46vh" : "none",
                overflowY: "auto",
                zIndex: 120,
                background: "linear-gradient(160deg, rgba(28,18,8,0.96), rgba(44,30,14,0.96))",
                border: "2px solid #c9a96e",
                borderRadius: "14px",
                padding: "10px 14px 12px",
                fontFamily: "Georgia, serif",
                color: "#f2e6c9",
                boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ fontWeight: "bold", color: "#f1d38a" }}>
                    🃏 {t("draftTitle")} — {t("draftRound", { n: Math.min(draft.round + 1, draft.rounds), total: draft.rounds })}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {status.map((s) => (
                        <span key={s.pid} title={s.done ? t("draftPicked") : t("draftThinking")} style={{ fontSize: "0.7rem", padding: "1px 8px", borderRadius: 999, border: `1px solid ${s.color}`, opacity: s.done ? 1 : 0.65 }}>
                            {s.done ? "✔" : "…"} {s.name}
                        </span>
                    ))}
                </div>
                {me && !picked && (
                    <div style={{ fontSize: "0.75rem", color: timeLeft <= 10 ? "#ff7a6a" : "#c9a96e" }}>⏳ {timeLeft}s</div>
                )}
            </div>

            <div style={{ fontSize: "0.72rem", color: "#c9a96e", margin: "4px 0 8px" }}>
                {!me ? t("draftSpectating") : picked ? t("draftWaiting") : t("draftHint")}
            </div>

            {me && pack && (
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", justifyContent: isMobile ? "flex-start" : "center" }}>
                    {pack.cards.map((card) => (
                        <DraftCard
                            key={card.id}
                            card={card}
                            compact={isMobile}
                            disabled={picked}
                            onPick={(id) => moves.draftPick?.(id)}
                            onHover={onHoverHex}
                        />
                    ))}
                </div>
            )}

            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.7rem", color: "#c9a96e" }}>{t("draftYourPicks")}:</span>
                {myPicks.length === 0 && <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{t("draftNoPicks")}</span>}
                {myPicks.map((card) => (
                    <DraftCard key={card.id} card={card} compact disabled onHover={onHoverHex} />
                ))}
            </div>
        </div>
    );
}
