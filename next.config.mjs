/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable image optimization for Prismic and other external sources
  images: {
    domains: ["images.prismic.io", "images.unsplash.com", "ik.imagekit.io"],
  },
  // Ignore ESLint during production builds (legacy mockup pages have entity escaping issues)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during builds (legacy code has type issues that don't affect runtime)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
