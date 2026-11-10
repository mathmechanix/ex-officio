import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/projects",
        destination: "/dashboard/projects",
      },
      {
        source: "/projects/:path*",
        destination: "/dashboard/projects/:path*",
      },
      {
        source: "/notifications",
        destination: "/dashboard/notifications",
      },
      {
        source: "/settings",
        destination: "/dashboard/settings",
      },
      {
        source: "/dashboard/ai-analysis",
        destination: "/dashboard/projects/proj-apollo-9/analysis",
      },
      {
        source: "/dashboard/insights",
        destination: "/dashboard/projects/proj-apollo-9/analysis",
      },
      {
        source: "/dashboard/reports",
        destination: "/dashboard/projects/proj-apollo-9/handover",
      },
      {
        source: "/dashboard/meetings",
        destination: "/dashboard/projects/proj-apollo-9/meetings",
      },
      {
        source: "/dashboard/risks",
        destination: "/dashboard/projects/proj-apollo-9/risks",
      },
    ];
  },
};

export default nextConfig;
