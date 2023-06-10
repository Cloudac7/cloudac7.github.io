---
title: "Containerize Your Life: 容器化LaTeX环境助力论文写作"
description: 用容器取代本地TeXLive环境实现LaTeX快速编译
author: 
  name: Cloudac7
date: 2023-06-03
image: docker.jpg
categories:
  - Tricks
  - Containerize Your Life
tags:
  - Docker
  - LaTeX
---

> 容器化拯救世界。——沃兹基硕德
> 
> 本文是 Containerize Your Life 系列的第2篇博文。
> 
> 这一系列旨在用容器化整合、加速环境部署，让读者快速聚焦于生产力，也是一些零散心得的整理。

没有什么比在一台全新的PC上安装TeXLive更加令人焦躁了。硕大的安装镜像、众多的宏包、令人眼花缭乱的参数设置……
诚然目前的教程已经足够清晰，考虑到前置步骤依然需要花费一些时间，而阻挡了我们进入专心的码字环节，依然会令人心生几分无奈。
无奈之余，毕业压力裹挟着LaTeX语法来袭，连睡梦里都是`\section{Introduction}`……

有没有什么办法，可以让我们快速部署好TeXLive环境，直接进入写作环节呢？聪明的你看标题便一定能够想到——容器化。

## 部署流程

话不多说，直接操练起来。

首先安装Docker，一般PC直接用[Docker Desktop](https://www.docker.com/products/docker-desktop/)就行，按照安装流程走完便可。

然后安装好本文的主角——[VSCode](https://code.visualstudio.com/)，并安装 [Dev Container 插件](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) 和 [LaTeX Workshop 插件](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop)、

创建或进入你的LaTeX项目目录。

然后 `Ctrl+,` 进入设置 (Mac是`⌘,`)。注意如果你不希望改变全局设置，请选择 `Workspace` 选项卡，则以下配置仅对当前工作区生效。

搜索 `Docker`，在左侧目录中找到 LaTeX 分类下的两个选项：`latex-workshop.docker.enabled` 和 `latex-workshop.docker.image.latex`。

根据设置的描述，这两个选项分别对应于是否启用 Docker 环境编译、选择哪个镜像导入。

于是我们勾选 `latex-workshop.docker.enabled`，启用，然后在 `latex-workshop.docker.image.latex` 的文本框中填入：

```
ghcr.io/xu-cheng/texlive-full
```

这里我们采用了 [Xu Cheng](https://github.com/xu-cheng) 大佬维护的 [TeXLive 容器环境](https://github.com/xu-cheng/latex-docker)，后者可以提供完整的特性支持。

在VSCode中，按下 <code>Ctrl+Shift+\`</code> 快捷键 (Mac是<code>⌃⇧\`</code>) 调出终端，拉取容器：

```bash
docker pull ghcr.io/xu-cheng/texlive-full
```

见证奇迹的时刻：编辑并保存你的`tex`文件，如果没有语法错误，LaTeX Workshop会自动保存并编译，若编译成功没有报错，便可在当前目录找到编译得到的PDF。右上角按钮提供了分栏功能可以快速预览得到的PDF，从而检查是否有语法错误。

## One More Trick: Github Action

在当前项目的根目录创建两层目录：`.github/workflows`，然后在里面创建一个 `compile.yaml` 文件，定义 Github Action Workflow:

```yaml
# This is a basic workflow to help you get started with Actions
name: Compile LaTeX

# Controls when the workflow will run
on:
  # Triggers the workflow on push or pull request events but only for the main branch
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
  # This workflow contains a single job called "build"
  build:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
      # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
      - uses: actions/checkout@v2
      - uses: xu-cheng/latex-action@v2
        with:
          root_file: main.tex
      - uses: actions/upload-artifact@v2.2.4
        with:
          name: main 
          path: main.pdf
          if-no-files-found: error
          retention-days: 7
```

分支请根据自己的情况进行修改，注意 `main.tex` 对应于你希望编译的主文件名，若为其他的，请对应修改，编译后的PDF文件名默认与之对应，所以下面的`path`也请对应修改。以上Action文件默认保留7天。

经过以上步骤，每次对 `master` 分支的提交便会触发一个编译流程，从而可以在Github Action中下载得到的文件供预览。
