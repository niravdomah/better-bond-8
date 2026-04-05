import { describe, it, expect } from "vitest";
import { formatCurrency, formatPercentage } from "../formatting";

describe("formatCurrency", () => {
  it("formats zero as R 0,00", () => {
    expect(formatCurrency(0)).toBe("R 0,00");
  });

  it("formats a large value with space separators and comma decimal", () => {
    expect(formatCurrency(1234567.89)).toBe("R 1 234 567,89");
  });

  it("formats a small value", () => {
    expect(formatCurrency(99.5)).toBe("R 99,50");
  });

  it("formats a value with no decimal part", () => {
    expect(formatCurrency(5000)).toBe("R 5 000,00");
  });

  it("formats a very large value", () => {
    expect(formatCurrency(2000000)).toBe("R 2 000 000,00");
  });

  it("formats a value with one decimal place", () => {
    expect(formatCurrency(123.4)).toBe("R 123,40");
  });
});

describe("formatPercentage", () => {
  it("formats a percentage value", () => {
    expect(formatPercentage(0.945)).toBe("0.945%");
  });

  it("formats a percentage with more decimals", () => {
    expect(formatPercentage(1.132)).toBe("1.132%");
  });
});
