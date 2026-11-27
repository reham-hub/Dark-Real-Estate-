import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/dark/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { EMAIL_RE } from "@/lib/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "استعادة كلمة المرور | دارك" },
      { name: "description", content: "استعد الوصول إلى حسابك في دارك." },
      { property: "og:title", content: "استعادة كلمة المرور | دارك" },
      { property: "og:description", content: "استعادة كلمة مرور حسابك في دارك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPage,
});

type Step = "email" | "code" | "reset" | "done";

function ForgotPage() {
  const { emailExists, resetPassword } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const sendCode = () => {
    setError("");
    if (!EMAIL_RE.test(email.trim())) return setError("أدخل بريدًا إلكترونيًا صالحًا");
    if (!emailExists(email)) return setError("لا يوجد حساب مسجل بهذا البريد");
    const c = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(c);
    setCode("");
    setStep("code");
    toast.success(`تم إرسال رمز التحقق إلى ${email.trim()}`, { description: `رمز العرض التجريبي: ${c}`, duration: 15000 });
  };

  const verify = () => {
    setError("");
    if (code !== sentCode) return setError("رمز التحقق غير صحيح");
    setStep("reset");
  };

  const save = () => {
    setError("");
    if (pw.length < 6) return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    if (pw !== confirm) return setError("كلمتا المرور غير متطابقتين");
    resetPassword(email, pw);
    setStep("done");
  };

  const steps: Step[] = ["email", "code", "reset"];

  return (
    <AuthLayout title="استعادة كلمة المرور" subtitle="سنساعدك على العودة إلى حسابك">
      {step !== "done" && (
        <div className="mb-6 flex gap-2">
          {steps.map((s, i) => (
            <span key={s} className={cn("h-1.5 flex-1 rounded-full", steps.indexOf(step) >= i ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      )}

      {step === "email" && (
        <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} className="space-y-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Mail className="size-7" />
          </div>
          <p className="text-sm text-muted-foreground">أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز تحقق من 6 أرقام.</p>
          <div className="space-y-1.5">
            <Label htmlFor="em">البريد الإلكتروني</Label>
            <Input id="em" type="email" dir="ltr" className="text-right" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full">إرسال الرمز</Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            أدخل الرمز المرسل إلى <span className="font-semibold text-foreground" dir="ltr">{email}</span>
          </p>
          <div dir="ltr" className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="size-12 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error && <p className="text-center text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={code.length !== 6}>تحقق</Button>
          <button type="button" onClick={sendCode} className="w-full text-sm font-semibold text-primary">إعادة إرسال الرمز</button>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <KeyRound className="size-7" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">كلمة المرور الجديدة</Label>
            <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf">تأكيد كلمة المرور</Label>
            <Input id="cf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full">حفظ كلمة المرور</Button>
        </form>
      )}

      {step === "done" && (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto size-16 text-success" />
          <h2 className="font-display text-xl font-bold">تم تغيير كلمة المرور</h2>
          <p className="text-sm text-muted-foreground">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
          <Button size="lg" className="w-full" onClick={() => navigate({ to: "/login", search: {} })}>تسجيل الدخول</Button>
        </div>
      )}

      {step !== "done" && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          تذكرت كلمة المرور؟{" "}
          <Link to="/login" search={{}} className="font-semibold text-primary">تسجيل الدخول</Link>
        </p>
      )}
    </AuthLayout>
  );
}
