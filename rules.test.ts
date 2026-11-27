import { describe, expect, it } from "vitest";
import { seedData } from "./seed";
import {
  canPostProperty,
  filterProperties,
  MAX_COMPARE,
  pricePerArea,
  toggleCompareList,
  validateReview,
  isServiceLocation,
} from "./rules";
import { MUKALLA_DISTRICTS } from "./constants";

const props = seedData.properties;
const user = (id: string) => { const found = seedData.users.find((u) => u.id === id); if (!found) throw new Error(id); return found; };
const prop = (id: string) => { const found = props.find((p) => p.id === id); if (!found) throw new Error(id); return found; };

describe("Mukalla coverage", () => {
  it("allows only Mukalla and its listed neighborhoods", () => {
    expect(isServiceLocation("المكلا", "الشرج")).toBe(true);
    expect(isServiceLocation("عدن", "الشرج")).toBe(false);
    expect(isServiceLocation("المكلا", "حدة")).toBe(false);
    expect(props.every((p) => isServiceLocation(p.city, p.district))).toBe(true);
    expect(MUKALLA_DISTRICTS.map((d) => d.name)).toContain("الديس");
    expect(filterProperties([{ ...prop("p1"), city: "صنعاء" }], {})).toEqual([]);
  });
  it("adds exactly ten varied approved properties to the existing twelve", () => {
    expect(props).toHaveLength(22);
    const added = props.filter((p) => Number(p.id.slice(1)) >= 13);
    expect(added).toHaveLength(10);
    expect(new Set(added.map((p) => p.type)).size).toBe(7);
    expect(added.every((p) => p.approval === "approved")).toBe(true);
  });
  it("filters a Mukalla neighborhood without returning other neighborhoods", () => {
    expect(filterProperties(props, { district: "خلف" }).map((p) => p.id)).toEqual(["p2", "p13"]);
  });
});

describe("owner verification (FR2)", () => {
  it("only an approved verification can post properties", () => {
    expect(canPostProperty("approved")).toBe(true);
    expect(canPostProperty("pending")).toBe(false);
    expect(canPostProperty("rejected")).toBe(false);
    expect(canPostProperty("none")).toBe(false);
  });
});

describe("review & approval (FR4)", () => {
  it("search never returns pending or rejected properties", () => {
    const ids = filterProperties(props, {}).map((p) => p.id);
    expect(ids).not.toContain("p9"); // pending
    expect(ids).not.toContain("p11"); // rejected
    expect(ids).toContain("p1");
  });
});

describe("filtering by location, price and type (FR7)", () => {
  it("filters by city", () => {
    const r = filterProperties(props, { city: "المكلا" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => p.city === "المكلا")).toBe(true);
  });
  it("filters by price range", () => {
    const r = filterProperties(props.slice(0, 12), { min: 20_000_000, max: 60_000_000 });
    expect(r.map((p) => p.id).sort()).toEqual(["p3", "p4", "p8"]);
  });
  it("filters by type", () => {
    const r = filterProperties(props.slice(0, 12), { type: "villa" });
    expect(r.map((p) => p.id)).toEqual(["p1"]);
  });
  it("searches by text in title or district (FR6)", () => {
    expect(filterProperties(props, { q: "شقة خلف" }).map((p) => p.id)).toEqual(["p2", "p13"]);
  });
});

describe("comparison (FR7)", () => {
  it("allows at most 3 properties", () => {
    expect(MAX_COMPARE).toBe(3);
    const r = toggleCompareList(["a", "b", "c"], "d");
    expect(r.error).toBeTruthy();
    expect(r.list).toEqual(["a", "b", "c"]);
  });
  it("toggles a property off when already compared", () => {
    expect(toggleCompareList(["a", "b"], "a").list).toEqual(["b"]);
  });
  it("computes price per square metre", () => {
    expect(pricePerArea({ price: 200_000_000, area: 650 })).toBe(307692);
  });
});

describe("review policy (FR12)", () => {
  const base = { property: prop("p1"), rating: 5, comment: "عقار ممتاز وموقعه رائع جدًا", existing: seedData.reviews };
  it("requires sign-in", () => {
    expect(validateReview({ ...base, user: null })).toMatch(/تسجيل الدخول/);
  });
  it("blocks owners from rating their own property", () => {
    expect(validateReview({ ...base, user: user("u1") })).toMatch(/عقارك/);
  });
  it("allows one review per user per property", () => {
    expect(validateReview({ ...base, user: user("u2") })).toMatch(/مسبقًا/);
  });
  it("rejects comments shorter than 10 characters", () => {
    expect(validateReview({ ...base, user: user("u3"), comment: "جيد" })).toBeTruthy();
  });
  it("rejects banned words and phone numbers", () => {
    expect(validateReview({ ...base, user: user("u3"), comment: "المالك نصاب لا تتعاملوا معه" })).toMatch(/مخالفة/);
    expect(validateReview({ ...base, user: user("u3"), comment: "اتصلوا على 777123456 للتفاصيل" })).toMatch(/أرقام/);
  });
  it("accepts a valid review", () => {
    expect(validateReview({ ...base, user: user("u3") })).toBeNull();
  });
});
