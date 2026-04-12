import type { MetadataRoute } from "next";
import { getAllDateParams } from "@/lib/data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bcamp-daily.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const dates = getAllDateParams();

  const episodeUrls = dates.map(({ date }) => ({
    url: `${BASE_URL}/bcamp/${date}`,
    lastModified: new Date(date),
    changeFrequency: "never" as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/bcamp`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...episodeUrls,
  ];
}
