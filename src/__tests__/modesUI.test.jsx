import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import DraftPanel from "../components/DraftPanel.jsx";
import Shop from "../components/Shop.jsx";
import GameHeader from "../components/GameHeader.jsx";
import Hex from "../components/Hex.jsx";
import GameSetupModal from "../GameSetupModal.jsx";
import { createClient, viewFor } from "./helpers/engine.js";
import { DRAFT_CONFIG, GAME_SETTINGS_DEFAULTS } from "../../game/constants.js";
import { saveWallet, loadWallet } from "../economy/walletStore.js";
import { credit } from "../economy/ledger.js";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ players: [] }) })));
});
afterEach(() => vi.unstubAllGlobals());

describe("<DraftPanel />", () => {
  function setupDraft() {
    const c = createClient({ numPlayers: 2, setupData: { gameMode: "draft" } });
    const view = viewFor(c, "0");
    const moves = { draftPick: vi.fn() };
    return { view, moves };
  }

  it("shows only my pack and sends the chosen card id", () => {
    const { view, moves } = setupDraft();
    render(<DraftPanel G={view.G} moves={moves} playerID="0" matchID="m" onHoverHex={() => {}} />);
    const mine = view.G.draft.packs.find((p) => !p.hidden);
    expect(mine.cards.length).toBe(DRAFT_CONFIG.packSize);
    const first = mine.cards[0];
    fireEvent.click(screen.getByTestId(`draft-card-${first.id}`));
    expect(moves.draftPick).toHaveBeenCalledWith(first.id);
    const hidden = view.G.draft.packs.find((p) => p.hidden);
    hidden && expect(screen.queryByTestId(`draft-card-${hidden.cards?.[0]?.id}`)).toBeNull();
  });

  it("disables cards after I picked and tells me I'm waiting", () => {
    const { view, moves } = setupDraft();
    const G = structuredClone(view.G); // engine state is frozen
    G.draft.pickedThisRound["0"] = true;
    render(<DraftPanel G={G} moves={moves} playerID="0" matchID="m" onHoverHex={() => {}} />);
    const pack = G.draft.packs.find((p) => !p.hidden);
    expect(screen.getByTestId(`draft-card-${pack.cards[0].id}`)).toBeDisabled();
    expect(screen.getByText(/Waiting for the other drafters/)).toBeInTheDocument();
  });

  it("highlights the hex on hover for hex cards", () => {
    const { view, moves } = setupDraft();
    const onHover = vi.fn();
    render(<DraftPanel G={view.G} moves={moves} playerID="0" matchID="m" onHoverHex={onHover} />);
    const hexCard = view.G.draft.packs.find((p) => !p.hidden).cards.find((c) => c.kind === "hex");
    fireEvent.mouseEnter(screen.getByTestId(`draft-card-${hexCard.id}`));
    expect(onHover).toHaveBeenCalledWith(hexCard.hexId);
  });

  it("auto-picks the best card when the timer runs out", () => {
    vi.useFakeTimers();
    const { view, moves } = setupDraft();
    render(<DraftPanel G={view.G} moves={moves} playerID="0" matchID="m" onHoverHex={() => {}} />);
    act(() => { vi.advanceTimersByTime((DRAFT_CONFIG.pickSeconds + 1) * 1000); });
    act(() => { vi.advanceTimersByTime(10); });
    expect(moves.draftPick).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("spectators get no cards and no auto-pick", () => {
    vi.useFakeTimers();
    const { view, moves } = setupDraft();
    render(<DraftPanel G={view.G} moves={moves} playerID={null} matchID="m" onHoverHex={() => {}} />);
    expect(screen.getByText(/watching the draft/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(60000); });
    expect(moves.draftPick).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("<Shop />", () => {
  it("shows the balance and blocks purchases you can't afford", () => {
    render(<Shop onClose={() => {}} />);
    expect(screen.getByTestId("wallet-balance")).toHaveTextContent("100");
    fireEvent.click(screen.getByText(/Piece skins/));
    expect(within(screen.getByTestId("shop-item-neon")).getByRole("button")).toBeDisabled();
  });

  it("needs a confirm click, then spends gold, grants the item and lets me equip it", () => {
    saveWallet(credit(loadWallet(), { amount: 400, reason: "t" }).wallet);
    render(<Shop onClose={() => {}} />);
    const card = () => screen.getByTestId("shop-item-parchment");
    fireEvent.click(within(card()).getByRole("button")); // arms the confirm
    expect(loadWallet().owned).not.toContain("parchment");
    fireEvent.click(within(card()).getByRole("button")); // confirms
    expect(loadWallet().owned).toContain("parchment");
    expect(loadWallet().balance).toBe(500 - 200);
    expect(screen.getByTestId("wallet-balance")).toHaveTextContent("300");
    fireEvent.click(within(card()).getByRole("button", { name: /Equip/ }));
    expect(loadWallet().equipped.boardTheme).toBe("parchment");
  });

  it("lists achievements and the transaction history", () => {
    render(<Shop onClose={() => {}} />);
    fireEvent.click(screen.getByText("Achievements"));
    expect(screen.getByTestId("ach-first_win")).toBeInTheDocument();
    fireEvent.click(screen.getByText("History"));
    expect(screen.getByText(/Welcome gift/)).toBeInTheDocument();
  });
});

describe("<GameSetupModal /> game modes", () => {
  const base = { ...GAME_SETTINGS_DEFAULTS };
  it("selecting Blitz emits the mode and shows forced values as locked", () => {
    const onChange = vi.fn();
    const { rerender } = render(<GameSetupModal settings={base} onChange={onChange} />);
    fireEvent.click(screen.getByText(/⚡ Blitz/));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ gameMode: "blitz" }));
    rerender(<GameSetupModal settings={{ ...base, gameMode: "blitz", victoryPointsTarget: 20 }} onChange={onChange} />);
    expect(screen.getByTestId("mode-description")).toHaveTextContent(/6 victory points/);
    expect(screen.getByText("6")).toBeDisabled();
    expect(screen.queryByText("20")).toBeNull();
  });

  it("is read-only in the lobby", () => {
    render(<GameSetupModal settings={{ ...base, gameMode: "draft" }} readOnly />);
    expect(screen.getByText(/🃏 Draft/).closest("button")).toBeDisabled();
  });
});

describe("<GameHeader /> modes", () => {
  const ctxFor = (c) => c.getState().ctx;
  it("shows the tide countdown with the number of hexes at risk", () => {
    const c = createClient({ numPlayers: 2, setupData: { gameMode: "shrinking" } });
    const { G, ctx } = c.getState();
    render(<GameHeader G={G} ctx={{ ...ctx, phase: "main" }} playerID="0" matchID="m" />);
    expect(screen.getByTestId("tide-banner")).toHaveTextContent(/Tide rises in 4 round/);
    expect(screen.getByTestId("tide-banner")).toHaveTextContent(new RegExp(`${G.flood.pending.length} hex`));
    expect(screen.getByTestId("mode-badge")).toHaveTextContent("Shrinking");
  });
  it("classic has no tide banner or badge", () => {
    const c = createClient({ numPlayers: 2 });
    const { G } = c.getState();
    render(<GameHeader G={G} ctx={{ ...ctxFor(c), phase: "main" }} playerID="0" matchID="m" />);
    expect(screen.queryByTestId("tide-banner")).toBeNull();
    expect(screen.queryByTestId("mode-badge")).toBeNull();
  });
});

describe("<Hex /> states", () => {
  const G = { board: { robberPosition: "none" }, isRobberPlacing: true };
  const hex = { id: "h1", x: 50, y: 50, terrain: "forest", number: 6 };
  it("flooded hexes show water, hide the number and offer no robber button", () => {
    const { container } = render(<Hex hex={{ ...hex, flooded: true }} G={G} moves={{}} width={100} height={100} />);
    expect(container.querySelector('[data-flooded="true"]')).not.toBeNull();
    expect(screen.getByText("Flooded")).toBeInTheDocument();
    expect(screen.queryByText("6")).toBeNull();
    expect(screen.queryByText("PLACE")).toBeNull();
  });
  it("dry hexes keep the number and the robber button", () => {
    render(<Hex hex={hex} G={G} moves={{}} width={100} height={100} />);
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("PLACE")).toBeInTheDocument();
  });
  it("pending hexes get a flood warning", () => {
    render(<Hex hex={hex} G={{ ...G, isRobberPlacing: false }} moves={{}} width={100} height={100} pending />);
    expect(screen.getByTitle("Floods at the next tide")).toBeInTheDocument();
  });
});

describe("<Hex /> flood animation trigger", () => {
  const G = { board: { robberPosition: "none" }, isRobberPlacing: false };
  const dry = { id: "h1", x: 50, y: 50, terrain: "forest", number: 6 };
  const props = { G, moves: {}, width: 100, height: 100 };

  it("does not animate a hex that is already flooded on first render (e.g. after a reload)", () => {
    const { container } = render(<Hex hex={{ ...dry, flooded: true }} {...props} />);
    expect(container.querySelector(".hex-water-rise")).toBeNull();
    expect(container.querySelector(".hex-ripple")).toBeNull();
    expect(container.querySelector(".hex-quake")).toBeNull();
  });

  it("plays the sinking animation when a dry hex goes under, keeping the token until it fades", () => {
    const { container, rerender } = render(<Hex hex={dry} {...props} />);
    expect(container.querySelector(".hex-water-rise")).toBeNull();
    rerender(<Hex hex={{ ...dry, flooded: true }} {...props} />);
    expect(container.querySelector(".hex-water-rise")).not.toBeNull();
    expect(container.querySelector(".hex-wave")).not.toBeNull();
    expect(container.querySelector(".hex-ripple")).not.toBeNull();
    expect(container.querySelector(".hex-quake")).not.toBeNull();
    expect(container.querySelectorAll(".hex-token-sink").length).toBe(2);
    expect(container.querySelector('[data-flooded="true"]')).not.toBeNull();
  });

  it("an unrelated re-render of an already-sunk hex does not restart the animation", () => {
    const { container, rerender } = render(<Hex hex={dry} {...props} />);
    rerender(<Hex hex={{ ...dry, flooded: true }} {...props} />);
    const water = container.querySelector(".hex-water-rise");
    rerender(<Hex hex={{ ...dry, flooded: true }} {...props} highlighted />);
    expect(container.querySelector(".hex-water-rise")).toBe(water);
  });

  it("never offers the robber button on a hex that just flooded", () => {
    const robbing = { ...G, isRobberPlacing: true };
    const { rerender } = render(<Hex hex={dry} {...props} G={robbing} />);
    expect(screen.getByText("PLACE")).toBeInTheDocument();
    rerender(<Hex hex={{ ...dry, flooded: true }} {...props} G={robbing} />);
    expect(screen.queryByText("PLACE")).toBeNull();
  });
});