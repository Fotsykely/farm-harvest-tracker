import { describe, expect, it } from "vitest";
import { readDecimal } from "./form-data";
import { quantityToInput, readQuantities } from "./harvest-form";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) formData.set(name, value);
  return formData;
}

describe("readDecimal", () => {
  it.each([
    ["12", 12],
    ["12.5", 12.5],
    ["12,5", 12.5],
    [" 1 250,75 ", 1250.75],
    ["0", 0],
    ["-3", -3], // negative: the API refuses it with its own message
  ])("reads %j as %d", (text, expected) => {
    expect(readDecimal(form({ q: text }), "q")).toBe(expected);
  });

  it("answers null for an empty or missing field", () => {
    expect(readDecimal(form({ q: "  " }), "q")).toBeNull();
    expect(readDecimal(form({}), "q")).toBeNull();
  });

  it.each(["abc", "12kg", "1,2,3", "12.", ".5"])("answers NaN for %j", (text) => {
    expect(readDecimal(form({ q: text }), "q")).toBeNaN();
  });
});

describe("readQuantities", () => {
  it("reads the three quantities and keeps the typed text", () => {
    const { quantities, values, errors } = readQuantities(form({ riceKg: "10,5", maizeKg: "0", cassavaKg: "" }));

    expect(quantities).toEqual({ riceKg: 10.5, maizeKg: 0, cassavaKg: null });
    expect(values).toEqual({ riceKg: "10,5", maizeKg: "0", cassavaKg: "" });
    expect(errors).toEqual({});
  });

  it("reports only the fields that are not numbers", () => {
    const { errors } = readQuantities(form({ riceKg: "beaucoup", maizeKg: "5", cassavaKg: "5" }));

    expect(Object.keys(errors)).toEqual(["riceKg"]);
  });
});

describe("quantityToInput", () => {
  it("writes decimals with a comma", () => {
    expect(quantityToInput(120.5)).toBe("120,5");
    expect(quantityToInput(80)).toBe("80");
  });
});
