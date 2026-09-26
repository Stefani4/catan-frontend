import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { setup } from "../../game/setup.js";
import { moves } from "../../game/moves.js";
import PostGameStats from "../components/PostGameStats.jsx";

function makeFinishedG() {
    const G = setup({ ctx: { numPlayers: 2 } }, {});
    G.stats.diceRolls[8] = 5;
    G.stats.diceRolls[6] = 3;
    G.stats.resourcesCollected["0"] = { lumber: 4, brick: 2, grain: 3, wool: 1, ore: 0 };
    G.stats.bankTrades["0"] = 2;
    G.stats.playerTrades["0"] = 1;
    G.stats.cardsBought["0"] = 3;
    G.stats.cardsPlayed["0"] = 1;
    G.stats.robberMoves["1"] = 2;
    G.players["0"].victoryPoints = 10;
    G.players["0"].settlements = [{ id: "i1" }];
    G.players["0"].cities = [{ id: "i2" }];
    return G;
}

describe("<PostGameStats />", () => {
    it("shows the dice histogram's most-rolled value and per-player resource totals", () => {
        const G = makeFinishedG();
        const ctx = { gameover: { winner: "0" }, numPlayers: 2 };

        render(<PostGameStats G={G} ctx={ctx} matchID="test-match" onClose={() => {}} />);

        // Most-rolled number (8, rolled 5 times) should be highlighted in the text.
        expect(screen.getByText("8", { selector: "b" })).toBeInTheDocument();

        // Resource total for player 0: 4+2+3+1+0 = 10
        expect(screen.getByText(/Resources Collected \(10\)/)).toBeInTheDocument();

        // Trading/dev-card counts render.
        expect(screen.getByText(/Bank Trades: 2/)).toBeInTheDocument();
        expect(screen.getByText(/Player Trades: 1/)).toBeInTheDocument();
        expect(screen.getByText(/Bought: 3/)).toBeInTheDocument();
    });

    it("close button fires onClose", () => {
        const G = makeFinishedG();
        const ctx = { gameover: { winner: "0" }, numPlayers: 2 };
        const onClose = vi.fn();

        render(<PostGameStats G={G} ctx={ctx} matchID="test-match" onClose={onClose} />);
        fireEvent.click(screen.getByText("✕"));
        expect(onClose).toHaveBeenCalled();
    });
});
