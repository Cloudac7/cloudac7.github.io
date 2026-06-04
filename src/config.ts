import type {
  ExpressiveCodeConfig,
  LicenseConfig,
  NavBarConfig,
  ProfileConfig,
  SiteConfig,
} from "./types/config"
import { LinkPreset } from "./types/config"

export const siteConfig: SiteConfig = {
  title: "奥尔特云",
  navtitle: "オールトの雲",
  subtitle: "Cloudac7",
  lang: "zh_CN",
  themeColor: {
    hue: 220,
    fixed: false,
  },
  banner: {
    enable: true,
    src: "/images/rukayuki.jpg",
    position: "center",
    credit: {
      enable: true,
      text: "Raito / One Helluva Morning I",
      url: "https://x.com/Raito_Taisha/status/1962827183493206048",
    },
  },
  toc: {
    enable: true,
    depth: 2,
  },
  favicon: [
    { src: "/favicon.svg" },
  ],
}

export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    {
      name: "分类",
      url: "/categories/",
      external: false,
    },
    {
      name: "专栏",
      url: "/topics/",
      external: false,
    },
    LinkPreset.Archive,
    LinkPreset.About,
  ],
}

export const profileConfig: ProfileConfig = {
  avatar: "/images/avatar.png",
  name: "Cloudac7",
  bio: "你眼中观测到的世界",
  bioFlip: "就是我的奥尔特云",
  links: [
    {
      name: "GitHub",
      icon: "fa6-brands:github",
      url: "https://github.com/Cloudac7",
    },
    {
      name: "Bilibili",
      icon: "fa6-brands:bilibili",
      url: "https://space.bilibili.com/3025889/",
    },
    {
      name: "Twitter",
      icon: "fa6-brands:x-twitter",
      url: "https://twitter.com/Cloudac7_Canoe/",
    },
  ],
}

export const licenseConfig: LicenseConfig = {
  enable: true,
  name: "CC BY-NC-SA 4.0",
  url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
}

export const expressiveCodeConfig: ExpressiveCodeConfig = {
  theme: "github-dark",
}
