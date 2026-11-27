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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_REASONS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { ReportTarget } from "@/lib/types";
import { useRequireLogin } from "./AuthGate";

export function ReportDialog({
  targetType,
  targetId,
  propertyId,
  trigger,
}: {
  targetType: ReportTarget;
  targetId: string;
  propertyId: string;
  trigger: (open: () => void) => ReactNode;
}) {
  const { addReport, reports, currentUser } = useStore();
  const requireLogin = useRequireLogin();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const already = reports.some(
    (r) => r.userId === currentUser?.id && r.targetId === targetId && r.status === "open",
  );

  const openDialog = () => {
    if (!requireLogin("سجّل الدخول للإبلاغ عن المحتوى")) return;
    if (already) { toast.info("لقد أبلغت عن هذا المحتوى وهو قيد المراجعة لدى الإدارة"); return; }
    setOpen(true);
  };

  const submit = () => {
    if (!reason) { toast.error("اختر سبب البلاغ"); return; }
    if (reason === "سبب آخر" && details.trim().length < 5) { toast.error("يرجى توضيح سبب البلاغ"); return; }
    addReport(targetType, targetId, propertyId, reason, details.trim());
    toast.success("تم إرسال البلاغ، ستراجعه الإدارة في أقرب وقت");
    setOpen(false);
    setReason("");
    setDetails("");
  };

  return (
    <>
      {trigger(openDialog)}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>{targetType === "property" ? "الإبلاغ عن العقار" : "الإبلاغ عن التقييم"}</DialogTitle>
            <DialogDescription>
              ساعدنا في الحفاظ على موثوقية المنصة. ما المخالفة لسياسة دارك؟
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={reason} onValueChange={setReason} className="gap-2" dir="rtl">
            {REPORT_REASONS.map((r) => (
              <Label
                key={r}
                htmlFor={`reason-${r}`}
                className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-soft"
              >
                <RadioGroupItem id={`reason-${r}`} value={r} />
                {r}
              </Label>
            ))}
          </RadioGroup>
          <Textarea
            placeholder="تفاصيل إضافية (اختياري)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={400}
          />
          <DialogFooter className="gap-2 sm:justify-start">
            <Button onClick={submit} variant="destructive">
              إرسال البلاغ
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
