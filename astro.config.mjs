import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from 'astro-sitemap'

export default defineConfig({
  site: 'https://cloudac7.github.io',
  integrations: [
    tailwind(),
    sitemap(),
  ],
  output: 'static',
  build: {
    assets: '_assets',
  },
  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
})
