import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/dark/AuthGate";
import { EmptyState } from "@/components/dark/EmptyState";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
import { PropertyForm } from "@/components/dark/PropertyForm";
import { Button } from "@/components/ui/button";
import { canPostProperty } from "@/lib/rules";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/owner/new")({
  head: () => ({
    meta: [
      { title: "إضافة عقار | دارك" },
      { name: "description", content: "أضف عقارك بالصور والموقع وأرسله لمراجعة الإدارة." },
      { property: "og:title", content: "إضافة عقار | دارك" },
      { property: "og:description", content: "نشر عقار جديد على دارك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewPropertyPage,
});

function NewPropertyPage() {
  return (
    <>
      <PageHeader back title="إضافة عقار جديد" />
      <PageBody className="max-w-3xl md:pb-16">
        <AuthGate message="سجّل الدخول لإضافة عقار">
          <Content />
        </AuthGate>
      </PageBody>
    </>
  );
}

function Content() {
  const { currentUser, getVerificationStatus, addProperty } = useStore();
  const navigate = useNavigate();
  const ver = getVerificationStatus(currentUser!.id);

  if (currentUser!.role === "admin")
    return <EmptyState icon={ShieldCheck} title="حسابات الإدارة لا تنشر عقارات" />;

  if (!canPostProperty(ver))
    return (
      <EmptyState
        icon={ver === "pending" ? Clock : ShieldCheck}
        title={ver === "pending" ? "توثيقك قيد المراجعة" : "وثّق هويتك أولًا"}
        description={
          ver === "pending"
            ? "ستتمكن من إضافة العقارات فور اعتماد الإدارة لوثيقتك."
            : "للحفاظ على موثوقية المنصة، يجب التحقق من هوية المالك قبل نشر أي عقار."
        }
        action={
          <Button asChild>
            <Link to="/verify">{ver === "pending" ? "متابعة الطلب" : "توثيق الهوية الآن"}</Link>
          </Button>
        }
      />
    );

  return (
    <PropertyForm
      submitLabel="إرسال للمراجعة"
      onSubmit={(data) => {
        const res = addProperty(data);
        if (!res.ok) { toast.error(res.error); return; }
        toast.success("تم إرسال العقار، سيظهر للزوار بعد موافقة الإدارة");
        navigate({ to: "/owner" });
      }}
    />
  );
}
