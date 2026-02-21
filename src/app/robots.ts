import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/billing/",
          "/settings/",
          "/auth/",
        ],
      },
    ],
    sitemap: "https://fieldnine.io/sitemap.xml",
    host: "https://fieldnine.io",
  };
}
