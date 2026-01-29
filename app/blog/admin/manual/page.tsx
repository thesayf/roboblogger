"use client";

import { useRouter } from "next/navigation";
import ManualBlogEditor from "../components/ManualBlogEditor";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";
import { ToastProvider } from "@/components/ui/toast";

export default function ManualEditorPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/blog/admin");
  };

  return (
    <AdminPasswordGate>
      <ToastProvider>
        <ManualBlogEditor onBack={handleBack} />
      </ToastProvider>
    </AdminPasswordGate>
  );
}
