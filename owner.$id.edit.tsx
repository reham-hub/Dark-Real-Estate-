import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/dark/AuthGate";
import { EmptyState } from "@/components/dark/EmptyState";
import { PageBody, PageHeader } from "@/components/dark/PageHeader";
import { PropertyForm } from "@/components/dark/PropertyForm";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/owner/$id/edit")({
  head: () => ({
    meta: [
      { title: "تعديل العقار | دارك" },
      { name: "description", content: "عدّل بيانات وصور وموقع عقارك على دارك." },
      { property: "og:title", content: "تعديل العقار | دارك" },
      { property: "og:description", content: "تعديل بيانات العقار." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditPropertyPage,
});

function EditPropertyPage() {
  return (
    <>
      <PageHeader back title="تعديل العقار" />
      <PageBody className="max-w-3xl md:pb-16">
        <AuthGate>
          <Content />
        </AuthGate>
      </PageBody>
    </>
  );
}

function Content() {
  const { id } = Route.useParams();
  const { propertyById, currentUser, updateProperty } = useStore();
  const navigate = useNavigate();
  const p = propertyById(id);

  if (!p || p.ownerId !== currentUser!.id)
    return (
      <EmptyState
        icon={Home}
        title="لا يمكن تعديل هذا العقار"
        description="العقار غير موجود أو لا تملك صلاحية تعديله."
        action={
          <Button asChild>
            <Link to="/owner">لوحة المالك</Link>
          </Button>
        }
      />
    );

  return (
    <>
      {p.approval === "approved" && (
        <p className="mb-4 rounded-2xl bg-warning-soft p-3 text-sm">
          تنبيه: حفظ التعديلات سيعيد العقار إلى المراجعة، وسيُخفى مؤقتًا حتى موافقة الإدارة.
        </p>
      )}
      <PropertyForm
        key={p.id}
        initial={p}
        submitLabel="حفظ التعديلات"
        onSubmit={(data) => {
          updateProperty(p.id, data);
          toast.success("تم حفظ التعديلات وإرسالها للمراجعة");
          navigate({ to: "/owner" });
        }}
      />
    </>
  );
}
