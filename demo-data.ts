import { seedData } from "./seed";
import type { AppData } from "./types";

export const DEMO_REVISION = 3;

/** Refresh demo content once without resetting accounts, messages or owner actions. */
export function refreshDemoData(data: AppData, revision = 0): AppData {
  if (revision >= DEMO_REVISION) return data;
  const properties = data.properties.map((property) => {
    const fresh = seedData.properties.find((p) => p.id === property.id);
    if (!fresh) return property;
    return {
      ...property,
      title: fresh.title,
      description: fresh.description,
      city: fresh.city,
      district: fresh.district,
      lat: fresh.lat,
      lng: fresh.lng,
      images: fresh.images,
    };
  });
  // Preserve deleted old demo listings; append only the ten newly introduced IDs.
  const existingIds = new Set(properties.map((p) => p.id));
  const additions = seedData.properties.filter(
    (p) => Number(p.id.slice(1)) >= 13 && !existingIds.has(p.id),
  );
  return { ...data, properties: [...properties, ...structuredClone(additions)] };
}
