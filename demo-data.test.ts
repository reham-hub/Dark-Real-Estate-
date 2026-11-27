import { describe, expect, it } from "vitest";
import { DEMO_REVISION, refreshDemoData } from "./demo-data";
import { seedData } from "./seed";

describe("local demo refresh", () => {
  it("updates old demo locations and adds ten properties without clearing local user actions", () => {
    const data = structuredClone(seedData);
    data.properties = data.properties.slice(0, 12).filter((p) => p.id !== "p4");
    const first = data.properties.find((p) => p.id === "p1");
    if (!first) throw new Error("Missing fixture");
    first.city = "صنعاء";
    first.district = "حدة";
    first.views = 999;
    first.status = "sold";
    const result = refreshDemoData(data);
    expect(result.properties).toHaveLength(21);
    expect(result.properties.some((p) => p.id === "p4")).toBe(false);
    expect(result.properties.find((p) => p.id === "p1")).toMatchObject({ city: "المكلا", district: "فوة", views: 999, status: "sold" });
    expect(result.users).toEqual(data.users);
    expect(result.conversations).toEqual(data.conversations);
    expect(result.favorites).toEqual(data.favorites);
  });
  it("does not re-add a deleted new listing on subsequent visits", () => {
    const data = structuredClone(seedData);
    data.properties = data.properties.filter((p) => p.id !== "p13");
    expect(refreshDemoData(data, DEMO_REVISION).properties.some((p) => p.id === "p13")).toBe(false);
  });
});