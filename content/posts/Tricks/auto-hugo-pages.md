---
title: "Hugo Github Action 配置说明"
author: 
  name: Cloudac7

date: 2021-07-08
categories:
  - 代码
  - 经验分享
---

## 前置准备

既然已经找到这里，应该已经知道如何用 Hugo 构建 Blog 页面，并可能已经了解 [Github Pages](https://docs.github.com/en/pages)。因此这里不在介绍 Hugo，如有需要请参考[官方文档](https://gohugo.io/)。

要想使用 Github Pages 构建静态网站，需要把相关代码放在 Github 仓库，命名为 `<username/organization>.github.io`。为便于说明，假设用户名为 `mira`。则仓库主分支目录结构大致如下：

```bash
mira.github.io
├── archetypes
├── config.yaml
├── content
├── data
├── static
└── themes
```

## 创建 SSH Deploy Key

详情请参考[文档说明](https://github.com/marketplace/actions/github-pages-action#%EF%B8%8F-create-ssh-deploy-key)。

在终端中（Windows可在git-scm终端）创建所需的密钥：

```bash
ssh-keygen -t rsa -b 4096 -C "$(git config user.email)" -f gh-pages -N ""
# You will get 2 files:
#   gh-pages.pub (public key)
#   gh-pages     (private key)
```

在仓库页面选择 Settings 标签，从左侧进入 Deploy Keys 设置，添加新的公钥，将公钥（`gh-pages.pub`）复制粘贴到 Key 框中，勾选下方的 "Allow write access"，点击 Save 保存。

点击左侧的 Secrets， 创建新的密钥，命名为 `ACTIONS_DEPLOY_KEY` 并将密钥（`gh-pages`）粘贴到下方框中，点击 Save 保存。

## 创建 Workflow

在仓库页面点击 Actions 标签，创建新的工作流（注意选择 set up a workflow yourself），路径为`.github/workflows/gh-pages.yml`，输入以下内容以创建配置文件：

```yaml
name: github pages

on:
  push:
    branches:
      - main  # Set a branch to deploy
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-20.04
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: true  # Fetch Hugo themes (true OR recursive)
          fetch-depth: 0    # Fetch all history for .GitInfo and .Lastmod

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'
          # extended: true

      - name: Build
        run: hugo --minify

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        if: github.ref == 'refs/heads/main'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

其中`main`分支为仓库主分支，若为 `master` 请手动替换。Workflow 默认选择创建 `gh-pages` 分支用于存放 Github Pages 所需文件，默认编译在 `public` 目录下并提交到该分支。若要更改此分支名，需要在`Deploy`部分指定：

```yaml
- name: Deploy
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_branch: your-branch  # default: gh-pages
```

更多设置请参考 [actions-hugo](https://github.com/marketplace/actions/hugo-setup) 和 [actions-gh-pages](https://github.com/marketplace/actions/github-pages-action)。

## 设置分支

实际上在工作流配置文件提交后，若 Workflow 建立成功，即可自动开启编译。但此时 Pages 仍然不可访问，原因是第一次编译后需要设置 Pages 分支到 `gh-pages`。请进入 Settings 中，并向下滚动到 GitHub Pages 设置项配置即可。生效一段时间后，即可访问 `http(s)://<username/organization>.github.io`。
