import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Board from "../components/Board.jsx";
import { setup } from "../../game/setup.js";

function makeG() {
    const G = setup({ ctx: { numPlayers: 2 } }, {});
    G.diceRolled = true;
    return G;
}

describe("<Board /> exit button", () => {
    it("shows a confirmation dialog before leaving, and cancel dismisses it without navigating", () => {
        const G = makeG();
        const ctx = { currentPlayer: "0", phase: "main", numPlayers: 2 };
        const moves = {};
        const events = {};

        render(<Board G={G} ctx={ctx} moves={moves} events={events} playerID="0" matchID="test-match" bots={[]} />);

        // Dialog should not be visible initially.
        expect(screen.queryByText(/Cancel|Annuler|Cancelar|Abbrechen/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByTitle("Exit Game"));
        expect(screen.getByText("Leave this match?")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Cancel"));
        expect(screen.queryByText("Leave this match?")).not.toBeInTheDocument();
    });
});
