import villa from "@/assets/mukalla-villa.jpg";
import house from "@/assets/mukalla-house.jpg";
import apartment from "@/assets/mukalla-apartment.jpg";
import land from "@/assets/mukalla-land.jpg";
import shop from "@/assets/mukalla-shop.jpg";
import building from "@/assets/mukalla-building.jpg";
import office from "@/assets/mukalla-office.jpg";
import apartmentCity from "@/assets/mukalla-apartment-city.jpg";
import apartmentSmall from "@/assets/mukalla-apartment-small.jpg";
import villaCourtyard from "@/assets/mukalla-villa-courtyard.jpg";

const SEED_IMAGES: Record<string, string> = {
  villa,
  house,
  apartment,
  land,
  shop,
  building,
  office,
  apartmentCity,
  apartmentSmall,
  villaCourtyard,
  // Resolve legacy references too, so previously saved photos remain usable.
  traditional: house,
  seafront: apartment,
  majlis: apartmentCity,
};

/** Seed images are stored as "seed:<key>" so persisted data survives asset hash changes. */
export function imgSrc(ref: string | undefined): string {
  if (!ref) return building;
  if (ref.startsWith("seed:")) return SEED_IMAGES[ref.slice(5)] ?? building;
  return ref;
}

/** Downscale an uploaded image to a compact JPEG data URL. */
export function fileToDataUrl(file: File, max = 1100, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("invalid image"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
