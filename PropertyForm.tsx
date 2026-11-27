import { useRef, useState } from "react";
import { ImagePlus, Loader2, MapPin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MUKALLA, MUKALLA_DISTRICTS, PROPERTY_TYPES, PURPOSES, STATUSES } from "@/lib/constants";
import { fileToDataUrl, imgSrc } from "@/lib/images";
import type { PropertyInput } from "@/lib/store";
import type { PropertyStatus, PropertyType, Purpose } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isServiceLocation } from "@/lib/rules";
import { LeafletMap } from "./LeafletMap";

const MAX_IMAGES = 8;

type Errors = Partial<Record<keyof PropertyInput, string>>;

export function PropertyForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<PropertyInput>;
  submitLabel: string;
  onSubmit: (data: PropertyInput) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<PropertyType>(initial?.type ?? "apartment");
  const [purpose, setPurpose] = useState<Purpose>(initial?.purpose ?? "sale");
  const [status, setStatus] = useState<PropertyStatus>(initial?.status ?? "available");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [area, setArea] = useState(initial?.area?.toString() ?? "");
  const [rooms, setRooms] = useState(initial?.rooms?.toString() ?? "");
  const city = MUKALLA.name;
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [lat, setLat] = useState(initial?.lat ?? MUKALLA.lat);
  const [lng, setLng] = useState(initial?.lng ?? MUKALLA.lng);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const onDistrict = (name: string) => {
    setDistrict(name);
    const found = MUKALLA_DISTRICTS.find((x) => x.name === name);
    if (found) {
      setLat(found.lat);
      setLng(found.lng);
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`الحد الأقصى ${MAX_IMAGES} صور`);
      return;
    }
    setUploading(true);
    try {
      const list = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, room);
      const urls = await Promise.all(list.map((f) => fileToDataUrl(f)));
      setImages((prev) => [...prev, ...urls]);
      if (files.length > room) toast.info(`تمت إضافة ${room} صور فقط (الحد الأقصى ${MAX_IMAGES})`);
    } catch {
      toast.error("تعذر قراءة إحدى الصور");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (title.trim().length < 8) errs.title = "أدخل عنوانًا واضحًا (8 أحرف على الأقل)";
    if (description.trim().length < 30) errs.description = "أضف وصفًا مفصلًا (30 حرفًا على الأقل)";
    if (!Number(price) || Number(price) <= 0) errs.price = "أدخل سعرًا صحيحًا";
    if (!Number(area) || Number(area) <= 0) errs.area = "أدخل المساحة";
    if (type !== "land" && (rooms === "" || Number(rooms) < 0)) errs.rooms = "أدخل عدد الغرف";
    if (!isServiceLocation(city, district)) errs.district = "اختر حارة من حارات المكلا";
    if (!images.length) errs.images = "أضف صورة واحدة على الأقل";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("يرجى تصحيح الحقول المطلوبة");
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      purpose,
      status,
      price: Number(price),
      area: Number(area),
      rooms: type === "land" ? 0 : Number(rooms),
      city,
      district: district.trim(),
      lat,
      lng,
      images,
    });
  };

  const err = (k: keyof PropertyInput) =>
    errors[k] ? <p className="text-xs font-medium text-destructive">{errors[k]}</p> : null;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {/* Photos */}
      <Section title="صور العقار" hint={`حتى ${MAX_IMAGES} صور، الصورة الأولى هي الرئيسية`}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((src, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
              <img src={imgSrc(src)} alt={`صورة ${i + 1}`} className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  الرئيسية
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-scrim p-1.5">
                {i !== 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setImages((p) => {
                        const photo = p[i];
                        return photo ? [photo, ...p.filter((_, j) => j !== i)] : p;
                      })
                    }
                    className="grid size-7 place-items-center rounded-full bg-card/90"
                    aria-label="تعيين كصورة رئيسية"
                  >
                    <Star className="size-3.5" />
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="grid size-7 place-items-center rounded-full bg-card/90 text-destructive"
                  aria-label="حذف الصورة"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              {uploading ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <ImagePlus className="size-6" />
              )}
              <span className="text-xs font-medium">إضافة صور</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
        {err("images")}
      </Section>

      {/* Basic info */}
      <Section title="المعلومات الأساسية">
        <Field label="عنوان الإعلان">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: شقة واسعة قرب الجامعة"
            maxLength={80}
          />
          {err("title")}
        </Field>
        <Field label="نوع العقار">
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((t) => (
              <Chip key={t.value} active={type === t.value} onClick={() => setType(t.value)}>
                {t.label}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="نوع العرض">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {PURPOSES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPurpose(p.value)}
                className={cn(
                  "rounded-lg py-2 text-sm font-semibold transition",
                  purpose === p.value
                    ? "bg-card text-primary shadow-soft"
                    : "text-muted-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="الوصف">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="صف العقار: المميزات، التشطيب، الخدمات القريبة..."
            maxLength={1200}
          />
          {err("description")}
        </Field>
      </Section>

      {/* Numbers */}
      <Section title="السعر والمساحة">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={purpose === "rent" ? "الإيجار الشهري (ريال يمني)" : "السعر (ريال يمني)"}
            className="col-span-2"
          >
            <Input
              inputMode="numeric"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              dir="ltr"
              className="text-right"
            />
            {err("price")}
          </Field>
          <Field label="المساحة (م²)">
            <Input
              inputMode="numeric"
              type="number"
              min={0}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="0"
              dir="ltr"
              className="text-right"
            />
            {err("area")}
          </Field>
          <Field label="عدد الغرف">
            <Input
              inputMode="numeric"
              type="number"
              min={0}
              value={type === "land" ? "0" : rooms}
              disabled={type === "land"}
              onChange={(e) => setRooms(e.target.value)}
              placeholder="0"
              dir="ltr"
              className="text-right"
            />
            {err("rooms")}
          </Field>
          <Field label="حالة العقار" className="col-span-2">
            <Select value={status} onValueChange={(v) => setStatus(v as PropertyStatus)} dir="rtl">
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Location */}
      <Section title="الموقع" hint="اضغط على الخريطة أو اسحب الدبوس لتحديد الموقع بدقة">
        <div className="grid grid-cols-2 gap-3">
          <Field label="المدينة">
            <Input value={city} readOnly aria-label="المدينة" />
          </Field>
          <Field label="الحارة / الحي">
            <Select value={district} onValueChange={onDistrict} dir="rtl">
              <SelectTrigger className="h-11 rounded-xl" aria-label="الحارة / الحي">
                <SelectValue placeholder="اختر الحارة" />
              </SelectTrigger>
              <SelectContent>
                {MUKALLA_DISTRICTS.map((d) => (
                  <SelectItem key={d.name} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("district")}
          </Field>
        </div>
        <LeafletMap
          lat={lat}
          lng={lng}
          zoom={13}
          onPick={(a, b) => {
            setLat(a);
            setLng(b);
          }}
        />
        <p className="flex items-center gap-1 text-xs text-muted-foreground" dir="ltr">
          <MapPin className="size-3.5" /> {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
        <Button type="submit" size="lg" className="w-full md:w-auto">
          {submitLabel}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground md:text-right">
          سيُراجع الإعلان من إدارة المنصة قبل نشره
        </p>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-3xl bg-card p-4 shadow-soft md:p-6">
      <div>
        <h2 className="font-display text-base font-bold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-foreground hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}
