import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DiceRoller from "../components/DiceRoller.jsx";

function baseProps(overrides = {}) {
  return {
    G: { settings: { diceMode: "standard" }, diceRolled: false, diceValue: null },
    ctx: { phase: "main", currentPlayer: "0" },
    moves: { rollDice: vi.fn() },
    playerID: "0",
    ...overrides,
  };
}

describe("<DiceRoller />", () => {
  it("button is enabled when it's the player's turn and dice not rolled yet", () => {
    render(<DiceRoller {...baseProps()} />);
    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Roll");
  });

  it("calls moves.rollDice() on click", () => {
    const rollDice = vi.fn();
    render(<DiceRoller {...baseProps({ moves: { rollDice } })} />);
    fireEvent.click(screen.getByRole("button"));
    expect(rollDice).toHaveBeenCalledTimes(1);
  });

  it("button is disabled when dice were already rolled this turn", () => {
    render(
        <DiceRoller
            {...baseProps({ G: { settings: {}, diceRolled: true, diceValue: 7 } })}
        />,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Rolled 7");
  });

  it("button is disabled when it's not the player's turn", () => {
    render(
        <DiceRoller
            {...baseProps({ ctx: { phase: "main", currentPlayer: "1" }, playerID: "0" })}
        />,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("button is disabled during setup phase", () => {
    render(<DiceRoller {...baseProps({ ctx: { phase: "setup", currentPlayer: "0" } })} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows Spin instead of Roll in wheel mode", () => {
    render(
        <DiceRoller
            {...baseProps({ G: { settings: { diceMode: "wheel" }, diceRolled: false, diceValue: null } })}
        />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Spin");
  });
});
