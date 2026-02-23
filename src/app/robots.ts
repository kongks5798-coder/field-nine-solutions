import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://fieldnine.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/billing/",
          "/settings/",
          "/auth/",
          "/workspace/",
          "/dashboard/",
          "/lab/",
          "/lm/",
          "/flow/",
          "/canvas/",
          "/team/",
          "/cloud/",
          "/cowork/",
          "/collab/",
          "/profile/",
          "/ide/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
