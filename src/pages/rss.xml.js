import rss from '@astrojs/rss'
import { getAllPosts } from '@/utils/posts'

export async function GET(context) {
  const posts = await getAllPosts()
  return rss({
    title: '奥尔特云 | Cloudac7',
    description: 'Cloudac7 的个人博客 — 代码 · 文字 · 胡思乱想',
    site: context.site,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/posts/${post.slug}/`,
    })),
    customData: '<language>zh-CN</language>',
  })
}
