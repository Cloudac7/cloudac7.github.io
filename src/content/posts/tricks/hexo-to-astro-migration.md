---
date: 2026-06-04
updated: 2026-06-04
categories:
  - Tricks
title: "从 Hexo 到 Astro：博客框架迁移记录"
description: "记录将博客从 Hexo + Stellar 迁移至 Astro + Fuwari 的完整过程，包括内容迁移、主题定制与性能对比。"
tags:
  - Astro
  - Hexo
  - Blog
---

## 动机

继从 Hugo 搬到 Hexo 后，选择了 [Stellar](https://github.com/xaoxuu/hexo-theme-stellar) 主题——功能丰富、设计精美，但也有其固有的问题：EJS 模板调试困难、Hexo 插件生态逐渐老化、构建速度受限于 Node.js 单线程。

随着 [Astro](https://astro.build) 生态的成熟，特别是在静态站点生成（SSG）领域的优异表现，终于下决心再次迁移。

## 选型

### 为什么是 Astro？

- **零 JS 输出**：默认情况下，Astro 在构建时渲染 HTML，不向客户端发送任何 JavaScript，除非显式声明
- **内容集合**：内置类型安全的内容管理系统，支持 Zod schema 校验
- **组件化**：`.astro` 单文件组件，融合了 JSX 的灵活性和模板语言的直观
- **构建速度**：使用 Vite 作为构建引擎，增量构建极快

### 为什么是 Fuwari？

在众多 Astro 博客主题中，[Fuwari](https://github.com/saicaca/fuwari) 脱颖而出：

- HSL 色相主题系统，支持访客自定义主题色
- Swup 页面过渡动画，SPA 般流畅
- PhotoSwipe 图片灯箱、Expressive Code 代码高亮
- Pagefind 静态搜索、完善的 i18n 支持

## 内容迁移

### Frontmatter 映射

最繁琐的部分是 frontmatter 字段的迁移。Hexo Stellar 使用了一套复杂的元数据系统：

| Hexo (Stellar) | Astro | 说明 |
|---|---|---|
| `date` | `date` | 保留 |
| `updated` | `updated` | 保留 |
| `categories` | `categories` | 保留，复数形式 |
| `tags` | `tags` | 保留 |
| `banner` | `banner` / `image` | Fuwari 使用 `image` 作为卡片封面 |
| `poster` | — | 移除 |
| `references` | — | 移除 |
| `type` | `type` | 保留 |

使用 Node.js 脚本批量处理了 28 篇文章的 frontmatter，移除了 Stellar 特有字段，并统一将 `published` 重命名为 `date`。

### 图片路径

Hexo 将图片存放在 `source/images/` 下，构建时复制到 `public/images/`。Astro 的 `public/` 目录直接映射到网站根目录，图片路径从 `/source/images/` 改为 `/images/` 即可。

### 标签插件 → Admonitions

Stellar 的 `{% note %}` 等标签插件在迁移中被放弃。Fuwari 内置了 admonitions 组件，兼容两种写法：

```markdown
> [!NOTE]
> GitHub 风格的 callout，使用默认标题。

:::warning[自定义标题]
Fuwari 原生 directive 语法，支持自定义标题。
:::
```

效果如下：

> [!NOTE]
> GitHub 风格的 callout，使用默认标题。

:::warning[自定义标题]
Fuwari 原生 directive 语法，支持在文档中直接书写。
:::

> [!NOTE]
> 对于 Obsidian 用户，`> [!type]` 语法可以直接从笔记中复制使用，无需额外转换。
>
> 注意：同行标题（如 `[!NOTE] 标题`）暂不支持，Fuwari admonition 组件目前仅渲染默认标题。

:::tip
建议在迁移前备份原始内容，并逐篇检查迁移后的效果。部分 Hexo 标签插件生成的 HTML 结构在 Astro 中可能无法正确渲染。
:::

### URL 结构变更

旧 URL 格式为 `/:year/:month/:day/:category/:title/`，为了简洁改为 `/posts/:path/`——文件路径直接映射：

- `content/posts/tricks/hexo-to-astro-migration.md` → `/posts/tricks/hexo-to-astro-migration/`

> 注意：这会影响 SEO。后续计划通过 Astro 的 `redirects` 配置添加 301 跳转。

## 主题定制

基于 Fuwari 进行了以下定制：

### 字体

使用 [LXGW WenKai Web](https://github.com/CMBill/lxgw-wenkai-web) 引入霞鹜文楷字体：

```css
font-family: "LXGW WenKai", Roboto, system-ui, sans-serif;
```

遇到了一个有趣的 bug：LXGW WenKai 的字体 metrics 与 Roboto 不同，导致文章内链接 hover 时 `border-bottom` 的 1px 溢出行框，引发后续文字下移。最终用 `box-shadow` 替代 `border-bottom` 解决了这个问题。

### Liquid Glass 导航栏

参考 [Kube 的 Liquid Glass 文章](https://kube.io/blog/liquid-glass-css-svg/)，为导航栏实现了毛玻璃效果：

```css
.liquid-glass-nav {
  background: color-mix(in oklch, var(--card-bg) 90%, transparent);
  backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.25);
}
```

通过 `color-mix()` 将 Fuwari 的 `--card-bg` CSS 变量与透明度混合，实现暗黑模式下随色相动态变化的玻璃质感。

```css
.dark .liquid-glass-nav {
  background: color-mix(in oklch, var(--card-bg) 60%, transparent);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow:
    0 2px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

### 专栏系统

保留了原博客的「专栏」概念——通过 `topics` 内容集合 + `topic` frontmatter 字段，在文章详情页展示所属专栏并链接到专栏聚合页。

### Profile 翻转

侧栏个人简介实现了 3D 翻转效果：默认显示「你眼中观测到的世界」，鼠标悬浮翻转显示「就是我的奥尔特云」——呼应博客名称的来源。

> [!NOTE]
> 这个效果是通过 CSS `transform: rotateY(180deg)` 实现的，配合 `backface-visibility: hidden` 隐藏背面内容。
>
> その目で観測する世界、それがオールトの雲。

## 性能对比

| 指标 | Hexo + Stellar | Astro + Fuwari |
|------|---------------|-----------------|
| 构建时间 | ~8s | ~6s |
| 首页 JS 体积 | ~200KB | ~50KB |
| 页面过渡 | 无 | Swup SPA |
| 图片灯箱 | 无 | PhotoSwipe |
| 静态搜索 | 无 | Pagefind |

## 部署迁移：GitHub Actions → Vercel

为实现静态和动态页面混合渲染，站点的部署流程从 GitHub Actions + GitHub Pages 迁移至 Vercel。

### 配置变更

将 Astro 的输出模式切换为 server 模式：

```diff
+ output: "server",
  adapter: vercel(),
```

同时将所有现有页面添加显式的静态预渲染声明：

```astro
---
export const prerender = true;
---
```

这样大部分页面在构建时仍生成静态 HTML，只有标记为 `prerender = false` 的动态路由走 Vercel SSR。

### CI/CD 调整

GitHub Actions 去掉了自动部署到 gh-pages 的步骤，只保留构建检查，生产部署交由 Vercel：

```diff
  on:
    push:
      branches: [master]
-     - Deploy to GitHub Pages
```

### 注意事项

- **构建产物**：server 模式下 `dist/` 同时包含静态文件和 SSR 函数打包结果，`.vercel/output/` 由适配器自动生成
- **Pagefind 索引**：构建命令仍包含 `pagefind --site dist`，只会索引静态页面，SSR 路由不会出现在搜索结果中
- **环境变量**：本地开发用 `.env` 文件，生产环境在 Vercel Dashboard 设置，均不提交到仓库

## 遗留问题

- [ ] 更多文章的标签补充

## 总结

从 Hexo 到 Astro 的迁移整体顺利。Astro 的组件化架构和 TypeScript 原生支持令定制化过程非常愉快，Fuwari 主题开箱即用的丰富功能也减少了大量重复工作。如果你也在考虑类似的迁移，希望这篇文章能提供参考。
