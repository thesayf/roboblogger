// lib/prismic.js
import * as prismic from "@prismicio/client";

export function createPrismicClient() {
  const repoName = "eb-todo-app";
  return prismic.createClient(repoName, {
    // Server-side environment variable, no NEXT_PUBLIC_ prefix needed
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });
}
