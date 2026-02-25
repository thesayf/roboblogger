import { Metadata } from "next";
import BlogAdminClient from "./BlogAdminClient";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";
import { SubscriptionGate } from "./components/SubscriptionGate";

export const metadata: Metadata = {
  title: "Dashboard - Vibeblogger",
  description: "AI-powered blog content management dashboard",
};

export default function BlogAdminPage() {
  return (
    <SubscriptionGate>
      <AdminPasswordGate>
        <BlogAdminClient />
      </AdminPasswordGate>
    </SubscriptionGate>
  );
}
