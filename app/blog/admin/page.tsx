import { Metadata } from "next";
import BlogAdminClient from "./BlogAdminClient";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";

export const metadata: Metadata = {
  title: "Blog Admin - ScheduleGenius",
  description: "Manage and create blog posts for ScheduleGenius",
};

export default function BlogAdminPage() {
  return (
    <AdminPasswordGate>
      <BlogAdminClient />
    </AdminPasswordGate>
  );
}
