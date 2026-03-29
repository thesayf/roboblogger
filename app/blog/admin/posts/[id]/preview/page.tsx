import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";
import PostPreviewClient from "./PostPreviewClient";

export const metadata: Metadata = {
  title: "Post Preview - Vibeblogger",
};

export default async function PostPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;

  return (
    <AdminPasswordGate>
      <PostPreviewClient postId={id} />
    </AdminPasswordGate>
  );
}
