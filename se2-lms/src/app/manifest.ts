import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CVSU LMS",
    short_name: "CVSU LMS",
    description: "Cavite State University Learning Management System",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2e7d32",
    icons: [
      { src: "/icons/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png?v=3", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png?v=3", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
