import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const QUICK = ["الصور غير واضحة أو لا تخص العقار", "معلومات ناقصة أو غير دقيقة", "السعر غير منطقي", "مخالف لسياسة النشر"];

export function RejectDialog({
  title,
  trigger,
  onConfirm,
}: {
  title: string;
  trigger: ReactNode;
  onConfirm: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>اكتب سبب الرفض ليظهر لصاحب الطلب.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setReason(q)}
              className="rounded-full border px-3 py-1 text-xs hover:border-primary hover:text-primary"
            >
              {q}
            </button>
          ))}
        </div>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الرفض" rows={3} />
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              if (reason.trim().length < 4) { toast.error("اكتب سبب الرفض"); return; }
              onConfirm(reason.trim());
              setOpen(false);
              setReason("");
            }}
          >
            تأكيد الرفض
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
