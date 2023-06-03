---
title: "隐秘的角落：MacOS下封印EasyConnect的权宜之计"
author: 
  name: Cloudac7
date: 2023-04-12
categories:
  - 代码
  - 经验分享
---

时过境迁，距离笔者撰写的[新时代的快乐科研：WSL2+Docker+EasyConnect+Clash](./WSL2_Docker_Easyconnect_Clash.md)已经过去一年有余。虽然目前新冠已经转为乙类乙管，大学校园封闭、全员核酸的故事已经成为古老的传言，但由于一些原因，笔者目前的日常办公环境游离在校园网之外，需要依靠EasyConnect与校园网内的服务器沟通。由于觊觎MacOS无缝的编程体验很久，加上手上首发购入的小新Pro13接连出现电源、硬盘等故障，遂于去年8月趁教育优惠<del>外加由于新版MacBook Air发布性价比不足旧版不仅不停售而且闲鱼价格水涨船高的神秘时间点</del>入手了M1版本的MacBook Air。因此本文的教程针对MacOS。

对于EasyConnect，上一篇教程主要目的正是将其封印在Docker之下。实际上发在知乎的版本下也有观众表示不解——我直接用官方客户端不就行了吗，为什么要大费周章搞Docker。当时的原因有二，一是EasyConnect不能对通过WSL 2的流量直接进行代理，二则也是本文的目的，请参考[这个视频](https://www.bilibili.com/video/BV163411Z7BD）。实际上我姑且相信厂商不会作恶，但作为强迫症患者，我无法接受在Apple Silicon平台常驻两个Rosetta 2转译的基于Intel架构编译的程序（

![除了Zotero以外全是EasyConnect.png](https://s2.loli.net/2023/04/12/A81ycq9Hn3Vfgwo.png)

但是，基于Docker的方法不适用于Apple Silicon平台，经过实测即使是采用Arm版本构建的镜像，由于各种原因仍然无法正确通过Socks5代理。考虑到折腾的麻烦以及校园网需求的迫切性，笔者索性放弃了Docker方案。实际上XMU提供的EasyConnect路由还算干净，基本上只是把校园网网段做了代理，虽然拜此所赐文献数据库需要采用其他方法连接，但整体使用体验还算OK，除了B站、知乎等略有卡顿，其他跟不使用EC比没有很大影响，特别是Clash不受影响。

## 清除开机启动项

EasyMonitor和ECAgent两个进程都是开机自动运行的，作为强迫症患者，首先要做的当然是清除开机启动项。

那么，请在启动台中打开`终端`（或者`iTerm2`等等，总之是顺手的终端），输入：

```bash
sudo rm /Library/LaunchDaemons/com.sangfor.EasyMonitor.plist
sudo rm /Library/LaunchAgents/com.sangfor.ECAgentProxy.plist
```

如提示输入密码，请输入并回车。

## 删除证书

然后请重启电脑，打开 `钥匙串访问` 程序，左侧选择 `系统`，右侧选择 `证书`，看到 `Sangfor Technologies Inc.`，右键选择删除证书即可。

若证书删除后不久又自动添加回来，请检查是否已经删除开机启动项并重启过。

## 脚本封印

启动编辑器编写如下脚本：

```bash
#!/bin/bash

/Applications/EasyConnect.app/Contents/Resources/bin/EasyMonitor > /dev/null 2>&1 &
/Applications/EasyConnect.app/Contents/MacOS/EasyConnect || true # > /dev/null 2>&1 &
pkill EasyMonitor
pkill ECAgent
pkill ECAgentProxy
```

将该文件放到 `$PATH` 路径下，取一个自己喜欢的名字，例如`easyconnect`。

如果你不知道 `$PATH` 路径，请运行 `echo $PATH` 查看。

## 封装脚本

每次都在终端运行命令对于需要开终端的工作流来说不算友好。但实际上，MacOS提供了一个自带的途径，可以把Shell脚本封装成App。

打开 `自动操作` 程序，点“取消”并再次点击程序坞上的图标，即可弹出新建自动操作的窗口，点击 `应用程序` 并选取。

![image.png](https://s2.loli.net/2023/04/12/UpnuokCE6x4McRX.png)

搜索框中搜索Shell，选择 `运行Shell脚本`，拖拽到右侧，如图：

![image.png](https://s2.loli.net/2023/04/12/wsKHOtdxLef8hER.png)

在文本框中输入上文编写的脚本路径，比如`/Users/user/.local/bin/easyconnect`，点击右上角的运行测试一下能否正确弹出EasyConnect程序。若通过，`编辑`-`存储`，将创建的应用程序存储在Application中即可。

这种方式创建的App可以通过启动台直接运行，体验和直接运行EasyConnect接近，且运行前后都会自动清理EC系列进程。

## 保险起见

经过实测上述方法即使通过用户权限运行，也仍然会有提权到Root的程序在后台，当然仅限于工作期间，实测并不会写入新的根证书。但作为强迫症，一个补救措施是连接成功后立即手动干掉两个进程，即：

```bash
pkill EasyMonitor
pkill ECAgent
```

实测二者被kill不会影响连接。

## 参考文献

本文参考了众多大佬的讨论，这里一并列出表示感谢。

> [EasyConnect 你想干甚？—— 干掉 macOS 版 EasyConnect 的流氓行为](https://blog.isteed.cc/post/fuck-easyconnect-on-macos/)
> [在 macOS 上安全使用 EasyConnect](https://soulike.tech/article/64)
> [Mac 中将脚本封装为 App](https://blog.csdn.net/qq_37164975/article/details/109519155)
> [macos 深信服的 easyconnect 是怎么做到自动提权到 root 的？](https://www.v2ex.com/t/899510)