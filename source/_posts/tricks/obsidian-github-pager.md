---
date: 2026-04-10
updated: 2026-04-10
title: "Obsidian Github Pager: 本地笔记同步到远程的管理工具"
categories:
  - Tricks
---
将笔记工作流从Notion完全迁移到Obsidian后，基于Markdown格式的笔记，便可以较为方便地同步到同样以Markdown格式为主的Github Pages仓库中。很多人都会采取类似的方案，即把Github Pages的Repo建立成Obsidian的一个Vault，同时针对这一方案，*也已经有了诸多成熟的方案*，这里不再赘述。

不过这样做同样存在一个痛点，由于搞定Obsidian笔记同步这件事已经会花掉不少精力，我采用的方案是便是将私人笔记和可公开的笔记混在一起，并没有为公开的笔记单独建立Vault（尽管后者可能才是推荐的方案）。这样一来同步到Github Pages这一任务便多了不少麻烦，即需要对可公开的笔记进行管理。

在此背景下，我索性Vibe Coding了一个插件，来解决这一问题——

{% link https://github.com/Cloudac7/obsidian-github-pager Cloudac7/obsidian-github-pager %}

插件目前尚未上架，因而想要体验的话，请在Release界面中下载1.0.1版本的三个文件:
- `main.js`
- `manifest.json`
- `styles.css
完成后，请在当前Vault目录下的 `.obsidian/plugins` 目录下建立 `obsidian-github-pager` 目录，并放入上述三个文件。

重启Obsidian，进入设置界面，即可发现在“第三方插件”部分增加了“Github Pager”的选项，点击便可看到如下图的界面：

![pager-setting-1.png](/source/images/pager-setting-1.png)

首先需要完成同步的前置准备工作，即根据这里的提示[生成一个 PAT (Personal Access Token)](https://docs.github.com/zh/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)。这里可以生成一个精细权限的PAT，即在[Fine-grained Personal Access Tokens](https://github.com/settings/personal-access-tokens)页面中，点击**Generate New Token**。在生成Token的页面中，设定其名称、描述以及有效期。为了安全起见，可以指定该Token仅可以访问Github Pages所在的仓库，然后为其添加权限，确保 **Contents** 一项为 **Read and Write**。

点击确定，即可复制所生成的PAT。注意其在页面上**仅会出现一次**，请妥善保存。

![github-pat-generation.png](/source/images/github-pat-generation.png)

回到Obsidian，将PAT填入到Github Token框中，然后指定仓库的Owner和Repository Name。这里Base path是指当未指定具体路径时，将 `.md` 文件同步到的路径；而Image path即默认图片的存储路径，对于Hexo博客来说，设置为 `source/images` 即可。

{% note 注意 Hexo仓库图片尽管存储在`source/images`中，在页面上引用时仍需要写成`/images/xxx.png`的形式。为确保后续的可迁移性，我是在构建时才进行替换。 color:warning %}

完成主要部分的设置后，便可以在设置中添加文件映射，这里列出几个例子：

![pager-file-mapping.png](/source/images/pager-file-mapping.png)

左侧的Local path即笔记在本地仓库的路径，可以通过右上角菜单的“复制路径-基于库的相对路径”来快速获取（如下图）。本地路径中不需要补充 `.md` 的扩展名。右侧则是远程仓库的文件路径（Remote file path）。注意如希望指定文件名，请在远程的设置中补充完整的文件名，可以与本地不同。

![pager-copy-path.png](/source/images/pager-copy-path.png)

当然除了在设置中指定映射，还有可以对需要同步的文件进行手动同步。

点击文档页面右上角按钮，即可发现 **Sync to Github** 的选项。若不做任何额外设置，点击该按钮，即会将该文件上传到设置中远程的 **Base path** 下，文件名同当前本地文件。当然，此时若点开设置页面，即可发现在设置中新增了一个映射。

而如果希望在这里仍可以指定上传的路径，可以在Markdown的Meta导言区增加一个 `remote_path` 选项，设定希望上传的远程路径。此时对单文件的同步便会按照指定路径进行，并且同样会把当前请求添加到全局的同步列表。

而当我们对映射表中多个文件均进行了改动，并希望批量提交时，可以通过 `Ctrl+P` (Windows) 唤出Obsidian命令菜单，搜索 “Github Pager: Sync all mapped files to Github”。此时即可对文件进行批量提交，且仅生成一个Commit。

![pager-sync-all.png](/source/images/pager-sync-all.png)

由此，通过Obsidian Github Pager插件，我们便可实现Obsidian仓库中的Markdown到Github Pages仓库的一一映射和管理。

当然，一个功能彩蛋是设置的Auto Sync选项，若开启，则可在列表中文件发生修改时实时同步文件。不过触发条件比较简单，因而个人不建议开启。