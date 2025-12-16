"use client";

import { useRouter } from "next/navigation";
import AIBlogEditor from "../components/AIBlogEditor";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";

export default function AIGenerationPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/blog/admin");
  };

  return (
    <AdminPasswordGate>
      <AIBlogEditor onBack={handleBack} />
    </AdminPasswordGate>
  );
}
