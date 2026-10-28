import { allSelected, showSelectAll, toggleAll } from "../src/utils/selectAll";

describe("select all", () => {
  it("shows from 3 options", () => {
    expect(showSelectAll(2)).toBe(false);
    expect(showSelectAll(3)).toBe(true);
  });

  it("ticks everything unless everything is already ticked", () => {
    expect(toggleAll(["a", "b", "c"], ["b"])).toEqual(["a", "b", "c"]);
    expect(toggleAll(["a", "b", "c"], [])).toEqual(["a", "b", "c"]);
    expect(toggleAll(["a", "b", "c"], ["c", "a", "b"])).toEqual([]);
  });

  it("knows when every option is ticked", () => {
    expect(allSelected(["a", "b"], ["b", "a"])).toBe(true);
    expect(allSelected(["a", "b"], ["a"])).toBe(false);
    expect(allSelected([], [])).toBe(false);
  });
});
