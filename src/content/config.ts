import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    draft: z.boolean().optional().default(false),
    description: z.string().optional().default(""),
    image: z.string().optional().default(""),
    tags: z.array(z.string()).optional().default([]),
    category: z.string().optional().nullable().default(""),
    lang: z.string().optional().default(""),

    // Our custom fields
    categories: z.array(z.string()).optional().default([]),
    banner: z.string().optional(),
    cover: z.string().optional(),
    topic: z.string().optional(),
    type: z.enum(["tech", "story"]).optional(),
    sticky: z.number().optional(),

    /* For internal use */
    prevTitle: z.string().default(""),
    prevSlug: z.string().default(""),
    nextTitle: z.string().default(""),
    nextSlug: z.string().default(""),
  }),
});

const topicsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    color: z.string().optional(),
  }),
});

const specCollection = defineCollection({
  schema: z.object({}),
});

export const collections = {
  posts: postsCollection,
  topics: topicsCollection,
  spec: specCollection,
};
