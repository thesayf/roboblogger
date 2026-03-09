import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import BlogAdminClient from "./BlogAdminClient";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";
import { SubscriptionGate } from "./components/SubscriptionGate";

export const metadata: Metadata = {
  title: "Dashboard - Vibeblogger",
  description: "AI-powered blog content management dashboard",
};

export default async function BlogAdminPage() {
  // Server-side auth check — redirects unauthenticated users before any client code runs
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <SubscriptionGate>
      <AdminPasswordGate>
        <BlogAdminClient />
      </AdminPasswordGate>
    </SubscriptionGate>
  );
}
