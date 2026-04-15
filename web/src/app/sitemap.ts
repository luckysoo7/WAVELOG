import type { MetadataRoute } from "next";
import { getAllDateParams } from "@/lib/data";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://bcamp-daily.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const bcampDates = getAllDateParams("bcamp");
  const byulbamDates = getAllDateParams("byulbam");

  const bcampPages: MetadataRoute.Sitemap = bcampDates.map(({ date }) => ({
    url: `${BASE_URL}/bcamp/${date}`,
    lastModified: new Date(date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const byulbamPages: MetadataRoute.Sitemap = byulbamDates.map(({ date }) => ({
    url: `${BASE_URL}/byulbam/${date}`,
    lastModified: new Date(date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/bcamp`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/byulbam`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...bcampPages,
    ...byulbamPages,
  ];
}
