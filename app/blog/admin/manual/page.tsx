"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import ManualBlogEditor from "../components/ManualBlogEditor";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";
import { ToastProvider } from "@/components/ui/toast";

function ManualEditorContent() {
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

export default function ManualEditorPage() {
  return (
    <Suspense>
      <ManualEditorContent />
    </Suspense>
  );
}
