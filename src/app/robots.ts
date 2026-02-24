import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

const BASE_URL = SITE_URL;

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
