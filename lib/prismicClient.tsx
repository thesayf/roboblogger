// lib/prismicClient.js
import * as prismic from "@prismicio/client";

export const repositoryName = "eb-todo-app";

export const prismicClient = prismic.createClient(repositoryName, {
  accessToken: process.env.PRISMIC_ACCESS_TOKEN, // Optional: only needed if your repository is private
});
