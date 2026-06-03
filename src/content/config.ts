import { defineCollection, z } from 'astro:content'

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    categories: z.array(z.string()),
    tags: z.array(z.string()).optional().default([]),
    description: z.string().optional(),
    updated: z.date().optional(),
    banner: z.string().optional(),
    cover: z.string().optional(),
    topic: z.string().optional(),
    type: z.enum(['tech', 'story']).optional(),
    sticky: z.number().optional(),
    draft: z.boolean().optional().default(false),
  }),
})

const topics = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    color: z.string().optional(),
  }),
})

export const collections = { posts, topics }
