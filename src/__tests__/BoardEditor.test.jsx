import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BoardEditor from "../components/BoardEditor.jsx";

describe("<BoardEditor />", () => {
    it("starts with exactly 19 hexes and exactly one Desert, save enabled", () => {
        const onSave = vi.fn();
        render(<BoardEditor onSave={onSave} onCancel={() => {}} />);

        expect(screen.getByText(/1 Desert — ready to save/)).toBeInTheDocument();
        const saveBtn = screen.getByText("Save Board");
        expect(saveBtn).not.toBeDisabled();
    });

    it("clicking Random Fill still produces a valid (single-desert) layout", () => {
        render(<BoardEditor onSave={() => {}} onCancel={() => {}} />);
        fireEvent.click(screen.getByText(/Random Fill/));
        expect(screen.getByText(/1 Desert — ready to save/)).toBeInTheDocument();
    });

    it("saving calls onSave with exactly 19 hexes", () => {
        const onSave = vi.fn();
        render(<BoardEditor onSave={onSave} onCancel={() => {}} />);
        fireEvent.click(screen.getByText("Save Board"));
        expect(onSave).toHaveBeenCalledTimes(1);
        const arg = onSave.mock.calls[0][0];
        expect(arg.hexes).toHaveLength(19);
        expect(arg.hexes.filter((h) => h.terrain === "desert")).toHaveLength(1);
    });

    it("cancel fires onCancel", () => {
        const onCancel = vi.fn();
        render(<BoardEditor onSave={() => {}} onCancel={onCancel} />);
        fireEvent.click(screen.getByText("Cancel"));
        expect(onCancel).toHaveBeenCalled();
    });
});
