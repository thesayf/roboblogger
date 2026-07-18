import connectDB from "@/lib/mongo";
import BlogPostRedirect from "@/models/BlogPostRedirect";

export async function getBlogPostRedirectTarget(
  fromSlug: string
): Promise<string | null> {
  if (!fromSlug) return null;

  await connectDB();
  const redirect = await BlogPostRedirect.findOne({
    fromSlug: fromSlug.toLowerCase(),
  })
    .select("toSlug")
    .lean<{ toSlug: string }>();

  if (!redirect?.toSlug || redirect.toSlug === fromSlug.toLowerCase()) {
    return null;
  }

  return redirect.toSlug;
}
