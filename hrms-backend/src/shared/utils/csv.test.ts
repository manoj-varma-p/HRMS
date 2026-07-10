import { describe, it, expect } from "vitest";
import { toCsv, exporters } from "./csv";

describe("toCsv", () => {
  it("joins header and rows with commas and newlines", () => {
    const csv = toCsv(["Name", "Status"], [["Jane Doe", "ON_TIME"], ["Alice", "LATE"]]);
    expect(csv).toBe("Name,Status\nJane Doe,ON_TIME\nAlice,LATE");
  });

  it("leaves plain cells unquoted", () => {
    expect(toCsv(["A"], [["plain value"]])).toBe("A\nplain value");
  });

  it("quotes a cell containing a comma", () => {
    expect(toCsv(["A"], [["has,comma"]])).toBe('A\n"has,comma"');
  });

  it("quotes a cell containing a newline", () => {
    expect(toCsv(["A"], [["line1\nline2"]])).toBe('A\n"line1\nline2"');
  });

  it("quotes and doubles embedded double-quotes", () => {
    expect(toCsv(["A"], [['she said "hi"']])).toBe('A\n"she said ""hi"""');
  });

  it("does not treat a lone double-quote-free cell as needing escaping", () => {
    expect(toCsv(["A"], [["no special chars here"]])).toBe("A\nno special chars here");
  });

  it("renders null/undefined cells as empty strings, not the literal text", () => {
    expect(toCsv(["A", "B"], [[null, undefined]])).toBe("A,B\n,");
  });

  it("stringifies non-string cell values (numbers, booleans)", () => {
    expect(toCsv(["Count", "Active"], [[42, true]])).toBe("Count,Active\n42,true");
  });

  it("handles an empty row set (header only)", () => {
    expect(toCsv(["A", "B"], [])).toBe("A,B");
  });
});

describe("exporters.csv", () => {
  it("wraps toCsv output with the correct content type and extension", () => {
    const result = exporters.csv(["A"], [["1"]]);
    expect(result.content).toBe("A\n1");
    expect(result.contentType).toBe("text/csv");
    expect(result.fileExtension).toBe("csv");
  });

  it("is the only registered exporter today (xlsx/pdf are future additions, not present yet)", () => {
    expect(Object.keys(exporters)).toEqual(["csv"]);
  });
});
