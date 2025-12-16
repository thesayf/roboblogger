"use client";

import { useRouter } from "next/navigation";
import ManualBlogEditor from "../components/ManualBlogEditor";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";

export default function ManualEditorPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/blog/admin");
  };

  return (
    <AdminPasswordGate>
      <ManualBlogEditor onBack={handleBack} />
    </AdminPasswordGate>
  );
}
