import { Metadata } from "next";
import BlogAdminClient from "./BlogAdminClient";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";

export const metadata: Metadata = {
  title: "Dashboard - RoboBlogger",
  description: "AI-powered blog content management dashboard",
};

export default function BlogAdminPage() {
  return (
    <AdminPasswordGate>
      <BlogAdminClient />
    </AdminPasswordGate>
  );
}
