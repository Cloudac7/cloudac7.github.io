---
title: "酷炫终端Banner生成方法"
author: 
  name: Cloudac7
date: 2023-05-15
categories:
  - Tricks
---

虽然不是每个人都喜欢徒增功耗的RGB跑马灯，但不可否认装机时候很多人看到ARGB还是会走不动道，只能安慰自己性能提升200%（）

那么有没有办法让每天都要面对的终端也显示出彩虹跑马的效果呢？

这里介绍两个小工具—— `figlet` 和 `lolcat` ，联合运用即可得到酷炫的终端字符画。

## Figlet

Figlet是一款字符画生成器，可以根据用户输入得到一个酷炫的字符画。例如：

```bash
figlet White Spell
```

可以看到输出如下：

![图 4](https://s2.loli.net/2023/05/15/MlfBtaRh6CWPO75.png)  

而且 `figlet` 可以切换字体，例如使用 `isometric3` 字体，就可以得到酷炫的3D字符画

```basic
~ figlet -f isometric3 White Spell
```

![图 3](https://s2.loli.net/2023/05/15/jICNGuM6PAksiw9.png)  

更多字体请参考[字体示例](http://www.figlet.org/examples.html)，在 `-f` 选项后输入相应的字体即可。

## Lolcat

有了第一步作为基础，我们就可以生成酷炫的RGB字符画了。

`lolcat` 是一个可以在终端为标准输入显示出彩虹渐变色彩的工具，我们通过其帮助文档一窥其强大实力。

![图 1](https://s2.loli.net/2023/05/15/RacbGMQpIZyUPDV.png)  


可以看到 `lolcat` 支持从文件或者标准输入中获取信息，那么自然地，我们想到通过管道把 `figlet` 的输出传递给 `lolcat` ：

```bash
figlet White Spell | lolcat
```

如图，漂亮的彩虹色🌈

![1](https://s2.loli.net/2023/05/15/yJOpZYEcB5kzeox.png)  

`lolcat` 的色彩是随机指定的，因而每次运行可能我们都会得到不同的输出。比较不那么碰运气的做法是，我们给定一个随机种子，例如：

```bash
figlet White Spell | lolcat -S 114514
```

就可以得到如图的输出，并且这个值是固定的。对于如何调随机种子，各位应该比我更有经验（x）

![图 6](https://s2.loli.net/2023/05/15/vN1uhbEsVjHKDoq.png)  

加上 `-f` 选项把如图的字符画导出到文本格式文件中：

```bash
figlet White Spell | lolcat -S 114514 -f > stdout.txt
```

用Vim打开，我们就可以看到带有颜色格式的字符画了：

![图 7](https://s2.loli.net/2023/05/15/YQc7zOrukRWKqEP.png)  

## 导入到Motd信息

自然地，我们会想到把上面这个文件里的内容全部复制粘贴到 `/etc/motd` 中，从而在每次登录终端时赏心悦目。但这样的特殊字符串，我们并不能指望剪切板帮助我们搞定一切，你很可能会看到一堆乱码而不是漂亮的字符画。因此高效的做法恰恰是利用文件IO。

首先检查自己的发行版有没有提供这个文件，若已提供，且希望添加到每次登陆后提示信息的末尾，只需：

```bash
sudo cat stdout.txt >> /etc/motd
```

若未提供，只需复制粘贴即可：

```bash
sudo cp stdout.txt /etc/motd
```

则可在每次登陆到终端时看见提示信息，如图：

![图 8](https://s2.loli.net/2023/05/15/2JCFbkdsMhUiWDT.png)  

当然你也可以选择先手动创建一个 `/etc/motd` 文件，在里面添加好必要的信息，再按照上文添加的方式放置到文件末尾。同理，先复制粘贴，再在文件结尾添加需要的信息，也是可以的。

> 题外话：对一些Ubuntu用户来说，可能很希望去掉系统自带的牛皮癣。这些文件没有放置在 `/etc/motd` 下，而是在 `/etc/update-motd.d/` 目录中。当然你也可以依样画葫芦，把字符画放在广告里（
>