import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

export type Post = CollectionEntry<'posts'>

export async function getAllPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft)
  return posts.sort((a, b) => {
    const sa = a.data.sticky ?? 0
    const sb = b.data.sticky ?? 0
    if (sa !== sb) return sb - sa
    return b.data.date.getTime() - a.data.date.getTime()
  })
}

export async function getPostsByCategory(category: string): Promise<Post[]> {
  const all = await getAllPosts()
  return all.filter(p => p.data.categories?.includes(category))
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const all = await getAllPosts()
  return all.filter(p => p.data.tags?.includes(tag))
}

export async function getPostsByTopic(topic: string): Promise<Post[]> {
  const all = await getAllPosts()
  return all.filter(p => p.data.topic === topic)
}

export async function getCategories(): Promise<Map<string, number>> {
  const posts = await getAllPosts()
  const map = new Map<string, number>()
  for (const p of posts) {
    for (const cat of p.data.categories ?? []) {
      map.set(cat, (map.get(cat) ?? 0) + 1)
    }
  }
  return map
}

export async function getTags(): Promise<Map<string, number>> {
  const posts = await getAllPosts()
  const map = new Map<string, number>()
  for (const p of posts) {
    for (const tag of p.data.tags ?? []) {
      map.set(tag, (map.get(tag) ?? 0) + 1)
    }
  }
  return map
}

export function paginate(posts: Post[], page: number, perPage = 10) {
  const totalPages = Math.ceil(posts.length / perPage)
  const start = (page - 1) * perPage
  const items = posts.slice(start, start + perPage)
  return { items, totalPages, currentPage: page }
}
